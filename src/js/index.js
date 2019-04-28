import { h, app } from 'hyperapp';
import '../style/index.scss';

const INSTANCE_DOMAIN = 'best-friends.chat';
// const INSTANCE_DOMAIN = 'knzk.me'; // テスト用

const domParser = new DOMParser();
const spaceRegExp = /( | )/gim;
const linkRegExp = /(https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:@&=+$,%#]+)/gim;

const state = {
  toots: []
};

const actions = {
  add: (data) => {
    const payload = data.toot;
    payload.content = domParser.parseFromString(payload.content, 'text/html').documentElement.textContent.replace(linkRegExp, '');

    // 画像のみ / スペースのみ / CW付きは読み込まない
    if (!payload.content || !payload.content.replace(spaceRegExp, '') || payload.spoiler_text) return state;

    if (!payload.account.display_name) {
      payload.account.display_name = payload.account.username;
    }

    if (data.use_push) {
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
    knzk.add({
      toot,
      use_push: true
    });
  });

  const ws = new WebSocket(`wss://${INSTANCE_DOMAIN}/api/v1/streaming?stream=public:local`);

  ws.onopen = () => {
    setInterval(() => ws.send('ping'), 5000);

    ws.onmessage = (data) => {
      const resdata = JSON.parse(data.data);

      if (resdata.event === 'update') {
        const toot = JSON.parse(resdata.payload);
        knzk.add({toot});
      }
    };

    ws.onclose = () => {
      location.reload();
    };
  };
});
