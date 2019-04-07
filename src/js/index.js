import { h, app } from 'hyperapp';
import '../style/index.scss';

const domParser = new DOMParser();

const INSTANCE_DOMAIN = 'friends.nico';

const state = {
  toots: []
};

const actions = {
  add: (payload, use_push = false) => {
    payload.content = domParser.parseFromString(payload.content, 'text/html').documentElement.textContent;
    if (!payload.content) return state; // 画像のみは弾く

    if (!payload.account.display_name) {
      payload.account.display_name = payload.account.username;
    }

    if (use_push) {
      state.toots.push(payload);
    } else {
      state.toots.unshift(payload);
    }

    if (state.toots.length > 30) {
      state.toots.pop();
    }

    return state;
  }
};

const view = (state, actions) => (
  <main>
    {state.toots.map(v => (
      <div class="toot">
        <div class="display_name">{v.account.display_name}</div>
        {v.content}
      </div>
    ))}
  </main>
);

const knzk = app(state, actions, view, document.body);

fetch(`https://${INSTANCE_DOMAIN}/api/v1/timelines/public?local=true`,{
  headers: { 'content-type': 'application/json' },
  method: 'GET'
}).then(response => {
  if (response.ok) {
    return response.json();
  } else {
    throw response;
  }
}).then(json => {
  json.forEach(toot => {
    knzk.add(toot, true);
  });

  const ws = new WebSocket(`wss://${INSTANCE_DOMAIN}/api/v1/streaming?stream=public:local`);

  ws.onopen = () => {
    setInterval(() => ws.send('ping'), 5000);

    ws.onmessage = (data) => {
      const resdata = JSON.parse(data.data);

      if (resdata.event === 'update') {
        const payload = JSON.parse(resdata.payload);
        knzk.add(payload);
      }
    };

    ws.onclose = () => {
      location.reload();
    };
  };
});