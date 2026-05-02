// Future dashboard scenes should use this contract so adding dashboards does
// not add independent permanent render loops.

export function createDashboardRuntime() {
  const dashboards = new Map();
  let activeId = null;

  function requireDashboard(id) {
    const dashboard = dashboards.get(id);
    if (!dashboard) throw new Error(`Unknown dashboard: ${id}`);
    return dashboard;
  }

  return {
    register(id, dashboard) {
      dashboards.set(id, {
        mount() {},
        preload() {},
        activate() {},
        deactivate() {},
        pause() {},
        resume() {},
        destroy() {},
        ...dashboard
      });
    },
    preload(id) {
      return requireDashboard(id).preload();
    },
    mount(id, container) {
      return requireDashboard(id).mount(container);
    },
    activate(id) {
      if (activeId && activeId !== id) {
        const current = requireDashboard(activeId);
        current.pause();
        current.deactivate();
      }
      activeId = id;
      const next = requireDashboard(id);
      next.activate();
      next.resume();
    },
    deactivate(id) {
      const dashboard = requireDashboard(id);
      dashboard.pause();
      dashboard.deactivate();
      if (activeId === id) activeId = null;
    },
    destroy(id) {
      const dashboard = requireDashboard(id);
      dashboard.destroy();
      dashboards.delete(id);
      if (activeId === id) activeId = null;
    },
    getActiveId() {
      return activeId;
    }
  };
}
