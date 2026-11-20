import { Command, Plugin, type SessionRef } from "@opencode/plugin/gui";
import { createSignal } from "solid-js";

const undoWindowSeconds = 5;

export default Plugin.define({
  setup(ctx) {
    const [archiving, setArchiving] = createSignal(false);
    let cancelPendingArchive: (() => void) | undefined;

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

          const cancel = () => {
            if (cancelPendingArchive !== cancel) return;
            cancelPendingArchive = undefined;
            clearTimeout(timer);
            toast.dismiss();
            setArchiving(false);
          };
          const toast = ctx.toast.show({
            title: `Archiving session in ${undoWindowSeconds} seconds`,
            description: session.server.data.session.get(session.id)?.title,
            persistent: true,
            actions: [{ label: "Undo", run: cancel }],
          });
          const timer = setTimeout(() => {
            cancelPendingArchive = undefined;
            toast.dismiss();
            void archive(session);
          }, undoWindowSeconds * 1000);
          cancelPendingArchive = cancel;
          setArchiving(true);
        },
      };
    });

    return () => cancelPendingArchive?.();
  },
});
