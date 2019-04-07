import { h, app } from 'hyperapp';
import '../style/index.scss';

const state = {
  toots: []
};

const actions = {
  connect: () => {
    const ws = new WebSocket(`wss://friends.nico/api/v1/streaming/public/local`);
    let heartbeat;

    ws.onopen = () => {
      heartbeat = setInterval(() => ws.send('ping'), 5000);

      ws.onmessage =
        config.live.page === 'livepage'
          ? livepage_comment.onmessage
          : comment_viewer.onmessage;

      ws.onclose = () => {
        kit.elemId('err_comment').className = '';
      };
    };
  }
};

const view = (state, actions) => (
  <main>
    <div class="list">
      {state.toots.map(v => (
        <span class="box" onclick={() => actions.play(v.file)}>{v.say}</span>
      ))}
    </div>
  </main>
);

app(state, actions, view, document.body);
