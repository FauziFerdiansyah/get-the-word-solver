// Minimal Web Audio stand-in for tests. jsdom has no AudioContext, so without
// this the sound engine silently bails and nothing about it can be asserted.
//
// It records every node that gets created plus the parameter values written to
// it. `kind` identifies the node; `type` is left writable because the code under
// test assigns oscillator and filter types to it.
export function createMockAudioContext(log) {
  const param = (name, node) => ({
    get value() {
      return node.params[name];
    },
    set value(v) {
      node.params[name] = v;
    },
    setValueAtTime: (v) => {
      node.params[name] = v;
      log.automation.push([node.kind, name, 'set', v]);
    },
    linearRampToValueAtTime: (v) => log.automation.push([node.kind, name, 'linear', v]),
    exponentialRampToValueAtTime: (v) => log.automation.push([node.kind, name, 'exp', v]),
  });

  const makeNode = (kind, extraParams = []) => {
    const node = { kind, params: {}, connected: [], started: false, stopped: false };
    for (const name of extraParams) node[name] = param(name, node);
    node.connect = (target) => {
      node.connected.push(target.kind ?? 'destination');
      return target;
    };
    node.start = () => { node.started = true; };
    node.stop = () => { node.stopped = true; };
    log.nodes.push(node);
    return node;
  };

  return class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.sampleRate = 48000;
      this.currentTime = 0;
      this.destination = { kind: 'destination' };
    }

    resume() { this.state = 'running'; }

    createBuffer(channels, length) {
      return { length, getChannelData: () => new Float32Array(length) };
    }

    createBufferSource() { return makeNode('bufferSource', ['playbackRate']); }
    createBiquadFilter() { return makeNode('biquad', ['frequency', 'Q']); }
    createGain() { return makeNode('gain', ['gain']); }
    createOscillator() { return makeNode('oscillator', ['frequency']); }
  };
}

export const emptyAudioLog = () => ({ nodes: [], automation: [] });
