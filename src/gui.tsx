import { Command, Plugin, Slot, Style, type SessionRef } from "@opencode/plugin/gui";
import { createSignal, Show } from "solid-js";

const undoWindowSeconds = 5;

type Countdown = {
  seconds: number;
  undo: () => void;
};

export default Plugin.define({
  setup(ctx) {
    const [archiving, setArchiving] = createSignal(false);
    const [countdown, setCountdown] = createSignal<Countdown>();
    let cancelPendingArchive: (() => void) | undefined;

    ctx.add(Style, `
      .santi-archive-toast {
        position: fixed;
        inset-inline-end: 32px;
        inset-block-end: 48px;
        z-index: 999;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: start;
        gap: 8px;
        box-sizing: border-box;
        width: min(320px, calc(100vw - 48px));
        padding: 12px;
        border-radius: 8px;
        background: var(--v2-background-bg-layer-01);
        color: var(--v2-text-text-base);
        box-shadow: var(--v2-elevation-floating);
      }
      .santi-archive-toast [role="timer"] {
        font-variant-numeric: tabular-nums;
      }
    `);

    ctx.add(Slot, {
      at: "window.bottom",
      render: () => (
        <Show when={countdown()}>
          {(notice) => (
            <div class="santi-archive-toast">
              <div>
                <span role="status">Archiving session</span>{" "}
                <span role="timer">in {notice().seconds} {notice().seconds === 1 ? "second" : "seconds"}</span>
              </div>
              <ctx.ui.Button size="small" onClick={() => notice().undo()}>Undo</ctx.ui.Button>
              <ctx.ui.IconButton
                icon="close"
                label="Dismiss archive countdown"
                size="small"
                onClick={() => setCountdown(undefined)}
              />
            </div>
          )}
        </Show>
      ),
    });

    const canArchive = (session: SessionRef) => {
      if (session.pending) return false;

      const { data } = session.server;
      return !(
        data.session.get(session.id)?.time.archived ||
        data.session.status(session.id) === "running" ||
        data.session.permission.list(session.id)?.length ||
        data.session.form.list(session.id, session.location)?.length
      );
    };

    const archive = async (session: SessionRef) => {
      try {
        if (!canArchive(session)) {
          ctx.toast.show({
            title: "Archive skipped",
            description: "The session can no longer be archived.",
          });
          return;
        }

        await session.server.client.session.update({
          sessionID: session.id,
          archived: true,
        });
        if (ctx.tabs.list().some((tab) => tab.key === session.tab && tab.session?.key === session.key)) {
          ctx.tabs.close(session.tab);
        }
      } catch (error) {
        ctx.toast.show({
          variant: "error",
          title: "Could not archive session",
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setArchiving(false);
      }
    };

    ctx.add(Command, (): Command => {
      const current = ctx.sessions.current();
      return {
        id: "archive",
        title: "Archive current session",
        description: "Move this session to the archive",
        section: "session",
        bind: "mod+shift+m",
        editable: true,
        enabled: !archiving() && !!current && canArchive(current),
        run: () => {
          const session = ctx.sessions.current();
          if (!session || archiving() || !canArchive(session)) return;

          const deadline = performance.now() + undoWindowSeconds * 1000;
          let timer: ReturnType<typeof setTimeout>;
          const cancel = () => {
            if (cancelPendingArchive !== cancel) return;
            cancelPendingArchive = undefined;
            clearTimeout(timer);
            setCountdown(undefined);
            setArchiving(false);
          };
          const tick = () => {
            const remaining = deadline - performance.now();
            if (remaining <= 0) {
              cancelPendingArchive = undefined;
              setCountdown(undefined);
              void archive(session);
              return;
            }

            const seconds = Math.ceil(remaining / 1000);
            setCountdown((notice) => notice && { ...notice, seconds });
            timer = setTimeout(tick, Math.ceil(remaining - (seconds - 1) * 1000));
          };

          cancelPendingArchive = cancel;
          setArchiving(true);
          setCountdown({
            seconds: undoWindowSeconds,
            undo: cancel,
          });
          tick();
        },
      };
    });

    return () => cancelPendingArchive?.();
  },
});
