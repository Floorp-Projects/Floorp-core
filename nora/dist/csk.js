import { z, a as zCSKData, c as checkIsSystemShortcut, b as csk_category, d as commands } from "./assets/utils.js";
const equalFn = (a, b) => a === b;
const $PROXY = Symbol("solid-proxy");
const $TRACK = Symbol("solid-track");
const signalOptions = {
  equals: equalFn
};
let runEffects = runQueue;
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
let Transition = null;
let ExternalSourceConfig = null;
let Listener = null;
let Updates = null;
let Effects = null;
let ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = owner, root = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = (value2) => {
    if (typeof value2 === "function") {
      value2 = value2(s.value);
    }
    return writeSignal(s, value2);
  };
  return [readSignal.bind(s), setter];
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
  if (s)
    c.suspense = s;
  c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || void 0;
  updateComputation(c);
  return readSignal.bind(c);
}
function untrack(fn) {
  if (Listener === null)
    return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig)
      ;
    return fn();
  } finally {
    Listener = listener;
  }
}
function onCleanup(fn) {
  if (Owner === null)
    ;
  else if (Owner.cleanups === null)
    Owner.cleanups = [fn];
  else
    Owner.cleanups.push(fn);
  return fn;
}
function useContext(context) {
  return Owner && Owner.context && Owner.context[context.id] !== void 0 ? Owner.context[context.id] : context.defaultValue;
}
let SuspenseContext;
function readSignal() {
  if (this.sources && this.state) {
    if (this.state === STALE)
      updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o))
            ;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure)
              Updates.push(o);
            else
              Effects.push(o);
            if (o.observers)
              markDownstream(o);
          }
          if (!TransitionRunning)
            o.state = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (false)
            ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn)
    return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(
    node,
    node.value,
    time
  );
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue);
    } else
      node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Owner === null)
    ;
  else if (Owner !== UNOWNED) {
    {
      if (!Owner.owned)
        Owner.owned = [c];
      else
        Owner.owned.push(c);
    }
  }
  return c;
}
function runTop(node) {
  if (node.state === 0)
    return;
  if (node.state === PENDING)
    return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback))
    return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state)
      ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (node.state === STALE) {
      updateComputation(node);
    } else if (node.state === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates)
    return fn();
  let wait = false;
  if (!init)
    Updates = [];
  if (Effects)
    wait = true;
  else
    Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait)
      Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    runQueue(Updates);
    Updates = null;
  }
  if (wait)
    return;
  const e = Effects;
  Effects = null;
  if (e.length)
    runUpdates(() => runEffects(e), false);
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++)
    runTop(queue[i]);
}
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user)
      runTop(e);
    else
      queue[userLength++] = e;
  }
  for (i = 0; i < userLength; i++)
    runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING)
        lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state) {
      o.state = PENDING;
      if (o.pure)
        Updates.push(o);
      else
        Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--)
      cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--)
      node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
}
function castError(err) {
  if (err instanceof Error)
    return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err, owner = Owner) {
  const error = castError(err);
  throw error;
}
const FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++)
    d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newLen = newItems.length, newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++)
          ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === void 0 ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== void 0 && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else
            disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else
            mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
function createComponent$1(Comp, props) {
  return untrack(() => Comp(props || {}));
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY)
      return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY)
      return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length; i < length; ++i) {
    const v = this[i]();
    if (v !== void 0)
      return v;
  }
}
function mergeProps$1(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (proxy) {
    return new Proxy(
      {
        get(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            const v = resolveSource(sources[i])[property];
            if (v !== void 0)
              return v;
          }
        },
        has(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            if (property in resolveSource(sources[i]))
              return true;
          }
          return false;
        },
        keys() {
          const keys = [];
          for (let i = 0; i < sources.length; i++)
            keys.push(...Object.keys(resolveSource(sources[i])));
          return [...new Set(keys)];
        }
      },
      propTraps
    );
  }
  const sourcesMap = {};
  const defined = /* @__PURE__ */ Object.create(null);
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    if (!source)
      continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i2 = sourceKeys.length - 1; i2 >= 0; i2--) {
      const key = sourceKeys[i2];
      if (key === "__proto__" || key === "constructor")
        continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get ? {
          enumerable: true,
          configurable: true,
          get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
        } : desc.value !== void 0 ? desc : void 0;
      } else {
        const sources2 = sourcesMap[key];
        if (sources2) {
          if (desc.get)
            sources2.push(desc.get.bind(source));
          else if (desc.value !== void 0)
            sources2.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1; i >= 0; i--) {
    const key = definedKeys[i], desc = defined[key];
    if (desc && desc.get)
      Object.defineProperty(target, key, desc);
    else
      target[key] = desc ? desc.value : void 0;
  }
  return target;
}
const narrowedError = (name) => `Stale read from <${name}>.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}
function Show(props) {
  const keyed = props.keyed;
  const condition = createMemo(() => props.when, void 0, {
    equals: (a, b) => keyed ? a === b : !a === !b
  });
  return createMemo(
    () => {
      const c = condition();
      if (c) {
        const child = props.children;
        const fn = typeof child === "function" && child.length > 0;
        return fn ? untrack(
          () => child(
            keyed ? c : () => {
              if (!untrack(condition))
                throw narrowedError("Show");
              return props.when;
            }
          )
        ) : child;
      }
      return props.fallback;
    },
    void 0,
    void 0
  );
}
function createRenderer$1({
  createElement: createElement2,
  createTextNode: createTextNode2,
  isTextNode,
  replaceText,
  insertNode: insertNode2,
  removeNode,
  setProperty,
  getParentNode,
  getFirstChild,
  getNextSibling
}) {
  function insert2(parent, accessor, marker, initial) {
    if (marker !== void 0 && !initial)
      initial = [];
    if (typeof accessor !== "function")
      return insertExpression(parent, accessor, initial, marker);
    createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    while (typeof current === "function")
      current = current();
    if (value === current)
      return current;
    const t = typeof value, multi = marker !== void 0;
    if (t === "string" || t === "number") {
      if (t === "number")
        value = value.toString();
      if (multi) {
        let node = current[0];
        if (node && isTextNode(node)) {
          replaceText(node, value);
        } else
          node = createTextNode2(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          replaceText(getFirstChild(parent), current = value);
        } else {
          cleanChildren(parent, current, marker, createTextNode2(value));
          current = value;
        }
      }
    } else if (value == null || t === "boolean") {
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      createRenderEffect(() => {
        let v = value();
        while (typeof v === "function")
          v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      if (normalizeIncomingArray(array, value, unwrapArray)) {
        createRenderEffect(
          () => current = insertExpression(parent, array, current, marker, true)
        );
        return () => current;
      }
      if (array.length === 0) {
        const replacement = cleanChildren(parent, current, marker);
        if (multi)
          return current = replacement;
      } else {
        if (Array.isArray(current)) {
          if (current.length === 0) {
            appendNodes(parent, array, marker);
          } else
            reconcileArrays(parent, current, array);
        } else if (current == null || current === "") {
          appendNodes(parent, array);
        } else {
          reconcileArrays(parent, multi && current || [getFirstChild(parent)], array);
        }
      }
      current = array;
    } else {
      if (Array.isArray(current)) {
        if (multi)
          return current = cleanChildren(parent, current, marker, value);
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !getFirstChild(parent)) {
        insertNode2(parent, value);
      } else
        replaceNode(parent, value, getFirstChild(parent));
      current = value;
    }
    return current;
  }
  function normalizeIncomingArray(normalized, array, unwrap) {
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i], t;
      if (item == null || item === true || item === false)
        ;
      else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item) || dynamic;
      } else if ((t = typeof item) === "string" || t === "number") {
        normalized.push(createTextNode2(item));
      } else if (t === "function") {
        if (unwrap) {
          while (typeof item === "function")
            item = item();
          dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item]) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else
        normalized.push(item);
    }
    return dynamic;
  }
  function reconcileArrays(parentNode, a, b) {
    let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = getNextSibling(a[aEnd - 1]), map = null;
    while (aStart < aEnd || bStart < bEnd) {
      if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
        continue;
      }
      while (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
      if (aEnd === aStart) {
        const node = bEnd < bLength ? bStart ? getNextSibling(b[bStart - 1]) : b[bEnd - bStart] : after;
        while (bStart < bEnd)
          insertNode2(parentNode, b[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart]))
            removeNode(parentNode, a[aStart]);
          aStart++;
        }
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = getNextSibling(a[--aEnd]);
        insertNode2(parentNode, b[bStart++], getNextSibling(a[aStart++]));
        insertNode2(parentNode, b[--bEnd], node);
        a[aEnd] = b[bEnd];
      } else {
        if (!map) {
          map = /* @__PURE__ */ new Map();
          let i = bStart;
          while (i < bEnd)
            map.set(b[i], i++);
        }
        const index = map.get(a[aStart]);
        if (index != null) {
          if (bStart < index && index < bEnd) {
            let i = aStart, sequence = 1, t;
            while (++i < aEnd && i < bEnd) {
              if ((t = map.get(a[i])) == null || t !== index + sequence)
                break;
              sequence++;
            }
            if (sequence > index - bStart) {
              const node = a[aStart];
              while (bStart < index)
                insertNode2(parentNode, b[bStart++], node);
            } else
              replaceNode(parentNode, b[bStart++], a[aStart++]);
          } else
            aStart++;
        } else
          removeNode(parentNode, a[aStart++]);
      }
    }
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === void 0) {
      let removed;
      while (removed = getFirstChild(parent))
        removeNode(parent, removed);
      replacement && insertNode2(parent, replacement);
      return "";
    }
    const node = replacement || createTextNode2("");
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = getParentNode(el) === parent;
          if (!inserted && !i)
            isParent ? replaceNode(parent, node, el) : insertNode2(parent, node, marker);
          else
            isParent && removeNode(parent, el);
        } else
          inserted = true;
      }
    } else
      insertNode2(parent, node, marker);
    return [node];
  }
  function appendNodes(parent, array, marker) {
    for (let i = 0, len = array.length; i < len; i++)
      insertNode2(parent, array[i], marker);
  }
  function replaceNode(parent, newNode, oldNode) {
    insertNode2(parent, newNode, oldNode);
    removeNode(parent, oldNode);
  }
  function spreadExpression(node, props, prevProps = {}, skipChildren) {
    props || (props = {});
    if (!skipChildren) {
      createRenderEffect(
        () => prevProps.children = insertExpression(node, props.children, prevProps.children)
      );
    }
    createRenderEffect(() => props.ref && props.ref(node));
    createRenderEffect(() => {
      for (const prop in props) {
        if (prop === "children" || prop === "ref")
          continue;
        const value = props[prop];
        if (value === prevProps[prop])
          continue;
        setProperty(node, prop, value, prevProps[prop]);
        prevProps[prop] = value;
      }
    });
    return prevProps;
  }
  return {
    render(code, element) {
      let disposer;
      createRoot((dispose2) => {
        disposer = dispose2;
        insert2(element, code());
      });
      return disposer;
    },
    insert: insert2,
    spread(node, accessor, skipChildren) {
      if (typeof accessor === "function") {
        createRenderEffect((current) => spreadExpression(node, accessor(), current, skipChildren));
      } else
        spreadExpression(node, accessor, void 0, skipChildren);
    },
    createElement: createElement2,
    createTextNode: createTextNode2,
    insertNode: insertNode2,
    setProp(node, name, value, prev) {
      setProperty(node, name, value, prev);
      return value;
    },
    mergeProps: mergeProps$1,
    effect: createRenderEffect,
    memo: createMemo,
    createComponent: createComponent$1,
    use(fn, element, arg) {
      return untrack(() => fn(element, arg));
    }
  };
}
function createRenderer(options) {
  const renderer = createRenderer$1(options);
  renderer.mergeProps = mergeProps$1;
  return renderer;
}
const eventListener = z.function().args(z.instanceof(Event)).or(
  z.object({
    handleEvent: z.function().args(z.instanceof(Event))
  })
);
const styleObject = z.record(z.string(), z.string());
const {
  render,
  effect,
  memo,
  createComponent,
  createElement,
  createTextNode,
  insertNode,
  /**
   * insertBefore
   */
  insert,
  spread,
  setProp,
  mergeProps
} = createRenderer({
  createElement: (tag) => {
    if (tag.startsWith("xul:")) {
      return document.createXULElement(tag.replace("xul:", ""));
    }
    return document.createElement(tag);
  },
  createTextNode: (value) => {
    return document.createTextNode(value);
  },
  replaceText: (textNode, value) => {
    textNode.data = value;
  },
  isTextNode: (node) => {
    return node.nodeType === 3;
  },
  setProperty: (node, name, value, prev) => {
    if (node instanceof Element) {
      const resultEvListener = eventListener.safeParse(value);
      const resultStyleObject = styleObject.safeParse(value);
      if (resultEvListener.success) {
        const evName = name.slice(2).toLowerCase();
        node.addEventListener(evName, resultEvListener.data);
      } else if (resultStyleObject.success) {
        let tmp = "";
        for (const [idx, v] of Object.entries(resultStyleObject.data)) {
          tmp += `${idx}:${v};`;
        }
        node.setAttribute(name, tmp);
      } else if (typeof value === "string") {
        node.setAttribute(name, value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        node.setAttribute(name, value.toString());
      } else if (value === void 0) {
        node.removeAttribute(name);
      } else {
        throw Error(
          `unreachable! @nora:solid-xul:setProperty the value is not EventListener, style object, string, number, nor boolean | is ${value}`
        );
      }
    } else {
      throw Error(
        `unreachable! @nora:solid-xul:setProperty the node is not Element | is ${node}`
      );
    }
  },
  insertNode: (parent, node, anchor) => {
    console.log(node);
    if (node instanceof Node) {
      parent.insertBefore(node, anchor ?? null);
    } else {
      throw Error("solid-xul insertNode `node` is not Node");
    }
  },
  removeNode: (parent, node) => {
    if (node instanceof Node) {
      parent.removeChild(node);
    } else {
      throw Error("solid-xul insertNode `node` is not Element nor XULElement");
    }
  },
  getParentNode: (node) => {
    return node.parentNode;
  },
  getFirstChild: (node) => {
    return node.firstChild;
  },
  getNextSibling: (node) => {
    return node.nextSibling;
  }
});
const [editingStatus, setEditingStatus] = createSignal(
  null
);
const [currentFocus, setCurrentFocus] = createSignal(null);
createEffect(() => {
  console.log(currentFocus() !== null);
  Services.obs.notifyObservers(
    {},
    "nora-csk",
    JSON.stringify({
      type: "disable-csk",
      data: currentFocus() !== null
    })
  );
});
const [cskData, setCSKData] = createSignal(
  //TODO: safely catch
  zCSKData.parse(
    JSON.parse(
      Services.prefs.getStringPref("floorp.browser.nora.csk.data", "{}")
    )
  )
);
function cskDatumToString(data, key) {
  if (key in data) {
    const datum = data[key];
    return `${(datum == null ? void 0 : datum.modifiers.ctrl) ? "Ctrl + " : ""}${(datum == null ? void 0 : datum.modifiers.alt) ? "Alt + " : ""}${(datum == null ? void 0 : datum.modifiers.shift) ? "Shift + " : ""}${datum == null ? void 0 : datum.key}`;
  }
  return "";
}
createEffect(() => {
  Services.prefs.setStringPref(
    "floorp.browser.nora.csk.data",
    JSON.stringify(cskData())
  );
  Services.obs.notifyObservers(
    {},
    "nora-csk",
    JSON.stringify({
      type: "update-pref"
    })
  );
});
function initSetKey() {
  document.addEventListener("keydown", (ev) => {
    const key = ev.key;
    const alt = ev.altKey;
    const ctrl = ev.ctrlKey;
    const shift = ev.shiftKey;
    const meta = ev.metaKey;
    if (key === "Escape" || key === "Tab") {
      return;
    }
    const focus = currentFocus();
    if (!(alt || ctrl || shift || meta)) {
      if (key === "Delete" || key === "Backspace") {
        if (focus) {
          ev.preventDefault();
          const temp = cskData();
          for (const key2 of Object.keys(temp)) {
            if (key2 === focus) {
              delete temp[key2];
              setCSKData(temp);
              setEditingStatus(cskDatumToString(cskData(), focus));
              break;
            }
          }
          console.log(cskData());
        }
        return;
      }
    }
    if (focus) {
      ev.preventDefault();
      if (["Control", "Alt", "Meta", "Shift"].filter((k) => key.includes(k)).length === 0) {
        if (checkIsSystemShortcut(ev)) {
          console.warn(`This Event is registered in System: ${ev}`);
          return;
        }
        setCSKData({
          ...cskData(),
          [focus]: {
            key,
            modifiers: {
              alt,
              ctrl,
              meta,
              shift
            }
          }
        });
        setEditingStatus(cskDatumToString(cskData(), focus));
      }
    }
  });
}
const CustomShortcutKeyPage = () => {
  return [(() => {
    var _el$ = createElement("div"), _el$2 = createElement("h1"), _el$3 = createElement("xul:description"), _el$4 = createElement("xul:checkbox");
    insertNode(_el$, _el$2);
    insertNode(_el$, _el$3);
    insertNode(_el$, _el$4);
    setProp(_el$2, "data-l10n-id", "floorp-CSK-title");
    setProp(_el$3, "class", "indent tip-caption");
    setProp(_el$3, "data-l10n-id", "floorp-CSK-description");
    setProp(_el$4, "data-l10n-id", "disable-fx-actions");
    return _el$;
  })(), createComponent(For, {
    each: csk_category,
    children: (category2) => (() => {
      var _el$5 = createElement("xul:vbox"), _el$6 = createElement("h2");
      insertNode(_el$5, _el$6);
      setProp(_el$5, "class", "csks-content-box");
      setProp(_el$6, "data-l10n-id", "floorp-custom-actions-" + category2);
      setProp(_el$6, "class", "csks-box-title");
      insert(_el$6, category2);
      insert(_el$5, createComponent(For, {
        get each() {
          return Object.entries(commands);
        },
        children: ([key, value]) => value.type === category2 ? (() => {
          var _el$7 = createElement("div"), _el$8 = createElement("label"), _el$9 = createElement("input");
          insertNode(_el$7, _el$8);
          insertNode(_el$7, _el$9);
          setProp(_el$7, "class", "csks-box-item");
          setProp(_el$7, "style", {
            display: "flex"
          });
          setProp(_el$8, "style", {
            "flex-grow": "1"
          });
          insert(_el$8, key);
          setProp(_el$9, "onFocus", (ev) => {
            setCurrentFocus(key);
          });
          setProp(_el$9, "onBlur", (ev) => {
            setEditingStatus(null);
            if (currentFocus() === key) {
              setCurrentFocus(null);
            }
          });
          setProp(_el$9, "readonly", true);
          setProp(_el$9, "placeholder", "Type a shortcut");
          setProp(_el$9, "style", {
            "border-radius": "4px",
            color: "inherit",
            padding: "6px 10px",
            "background-color": "transparent !important",
            border: "1px solid var(--input-border-color) !important",
            transition: "all .2s ease-in-out !important"
          });
          effect((_p$) => {
            var _v$ = "floorp-custom-actions-" + key.replace("floorp-", "").replace("gecko-", ""), _v$2 = currentFocus() === key && editingStatus() !== null ? editingStatus() : cskDatumToString(cskData(), key);
            _v$ !== _p$.e && (_p$.e = setProp(_el$8, "data-l10n-id", _v$, _p$.e));
            _v$2 !== _p$.t && (_p$.t = setProp(_el$9, "value", _v$2, _p$.t));
            return _p$;
          }, {
            e: void 0,
            t: void 0
          });
          return _el$7;
        })() : void 0
      }), null);
      return _el$5;
    })()
  })];
};
const [showCSK, setShowCSK] = createSignal(false);
const onHashChange = (ev) => {
  switch (location.hash) {
    case "#csk": {
      setShowCSK(true);
      break;
    }
    default: {
      setShowCSK(false);
    }
  }
};
function initHashChange() {
  window.addEventListener("hashchange", onHashChange);
  onHashChange();
}
function csk() {
  initSetKey();
  return (() => {
    var _el$ = createElement("section");
    setProp(_el$, "id", "nora-csk-entry");
    insert(_el$, createComponent(Show, {
      get when() {
        return showCSK();
      },
      get children() {
        return createComponent(CustomShortcutKeyPage, {});
      }
    }));
    return _el$;
  })();
}
function category() {
  return (() => {
    var _el$ = createElement("xul:richlistitem"), _el$2 = createElement("xul:image"), _el$3 = createElement("xul:label");
    insertNode(_el$, _el$2);
    insertNode(_el$, _el$3);
    setProp(_el$, "id", "category-csk");
    setProp(_el$, "class", "category");
    setProp(_el$, "value", "paneCsk");
    setProp(_el$, "helpTopic", "prefs-csk");
    setProp(_el$, "data-l10n-id", "category-CSK");
    setProp(_el$, "data-l10n-attrs", "tooltiptext");
    setProp(_el$, "align", "center");
    setProp(_el$2, "class", "category-icon");
    setProp(_el$3, "class", "category-name");
    setProp(_el$3, "flex", "1");
    setProp(_el$3, "data-l10n-id", "category-CSK-title");
    return _el$;
  })();
}
function initScripts() {
  const init = () => {
    var _a;
    insert(
      document.querySelector("#categories"),
      category(),
      document.getElementById("category-Downloads")
    );
    render(csk, document.querySelector(".pane-container"));
    initHashChange();
    switch (location.hash) {
      case "#csk": {
        (_a = document.getElementById("category-csk")) == null ? void 0 : _a.click();
        break;
      }
    }
  };
  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}
initScripts();
//# sourceMappingURL=csk.js.map
