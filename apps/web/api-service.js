// Browser-side workflow client. Credentials never belong in this file.
(function () {
  var mapPromise;

  function loadMap() {
    if (!mapPromise) {
      mapPromise = fetch('./workflow-map.json', { headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('工作流映射文件无法加载。');
          return response.json();
        });
    }
    return mapPromise;
  }

  function generate(toolId, params) {
    params = params || {};
    return loadMap().then(function (map) {
      var config = map[toolId];
      if (!config) throw new Error('未登记工作流：' + toolId);
      var bridge = window.__OVS_WORKFLOW_API__;
      if (bridge && typeof bridge.generate === 'function') {
        return bridge.generate(toolId, Object.assign({}, params, { workflow: config }));
      }
      // Static hosting has no server proxy. Do not pretend that a provider call succeeded.
      return fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ toolId: toolId, workflowId: config.workflowId, params: params })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok) throw new Error(body.error || '工作流服务未配置。');
          return body;
        });
      });
    });
  }

  window.__OVS_API_SERVICE__ = { loadMap: loadMap, generate: generate };
}());
