var TEMPLATE_INFO={"author":{"did":"did:key:zQ3shWx2wfcxW2dhh3LyTPiPNBb8ANX4VZGgz6fpd2WdHzNNq"},"timestamp":"2021-06-04T15:06:27.541Z","data":{"name":"__WORLD","description":"All Peers","type":"holochain","linkLanguages":[],"allowedExpressionLanguages":[],"requiredExpressionLanguages":[]},"proof":{"key":"#zQ3shWx2wfcxW2dhh3LyTPiPNBb8ANX4VZGgz6fpd2WdHzNNq","signature":"b8dc122c52da82a1c249107b5e99826d3151d0d2c0be72fcbf72be5a89468adc2bfed2e2f1ae53212838e98843cff7138383188c892eee7670b9076c0e0554c2"}}; var TEMPLATE_UUID="QmT3bJiHaeorFW65Dd6CAb35eAMBmp7SvH7PdAnBjSExcA;"
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });



const DNA = Buffer.from(dna, "base64");
const DNA_NICK = "social-context-channel";

const DEFAULT_GET_LINKS_LIMIT = 50;
class JuntoSocialContextLinkAdapter {
    constructor(context) {
        //@ts-ignore
        this.socialContextDna = context.Holochain;
    }
    writable() {
        return true;
    }
    public() {
        return false;
    }
    async addActiveAgentLink(hcDna) {
        if (hcDna == undefined) {
            //@ts-ignore
            return await this.call(DNA_NICK, "social_context", "add_active_agent_link", null);
        }
        else {
            return await hcDna.call(DNA_NICK, "social_context", "add_active_agent_link", null);
        }
    }
    async others() {
        return await this.socialContextDna.call(DNA_NICK, "social_context", "get_others", {});
    }
    async addLink(link) {
        const data = prepareExpressionLink(link);
        await this.socialContextDna.call(DNA_NICK, "social_context", "add_link", {
            link: data,
            index_strategy: "Full",
        });
        await this.socialContextDna.call(DNA_NICK, "social_context", "index_link", {
            link: data,
            index_strategy: "Full",
        });
    }
    async updateLink(oldLinkExpression, newLinkExpression) {
        const source_link = prepareExpressionLink(oldLinkExpression);
        const target_link = prepareExpressionLink(newLinkExpression);
        await this.socialContextDna.call(DNA_NICK, "social_context", "update_link", { source: source_link, target: target_link });
    }
    async removeLink(link) {
        const data = prepareExpressionLink(link);
        await this.socialContextDna.call(DNA_NICK, "social_context", "remove_link", data);
    }
    async getLinks(query) {
        const link_query = Object.assign(query);
        if (!link_query.source) {
            link_query.source = "root";
        }
        if (link_query.source == undefined) {
            link_query.source = null;
        }
        if (link_query.target == undefined) {
            link_query.target = null;
        }
        if (link_query.predicate == undefined) {
            link_query.predicate = null;
        }
        if (link_query.fromDate) {
            link_query.fromDate = link_query.fromDate.toISOString();
        }
        if (link_query.untilDate) {
            link_query.untilDate = link_query.untilDate.toISOString();
        }
        link_query.limit = DEFAULT_GET_LINKS_LIMIT;
        const links = await this.socialContextDna.call(DNA_NICK, "social_context", "get_links", link_query);
        //console.debug("Holchain Social Context: Got Links", links);
        return links;
    }
    addCallback(callback) {
        return 0;
    }
    handleHolochainSignal(signal) {
        //@ts-ignore
        this.ad4mSignal(signal);
    }
}
function prepareExpressionLink(link) {
    const data = Object.assign(link);
    if (data.data.source == "") {
        data.data.source = null;
    }
    if (data.data.target == "") {
        data.data.target = null;
    }
    if (data.data.predicate == "") {
        data.data.predicate = null;
    }
    return data;
}

var SettingsIcon = "'use strict';\n\nfunction noop() { }\nfunction run(fn) {\n    return fn();\n}\nfunction blank_object() {\n    return Object.create(null);\n}\nfunction run_all(fns) {\n    fns.forEach(run);\n}\nfunction is_function(thing) {\n    return typeof thing === 'function';\n}\nfunction safe_not_equal(a, b) {\n    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');\n}\nfunction is_empty(obj) {\n    return Object.keys(obj).length === 0;\n}\nfunction insert(target, node, anchor) {\n    target.insertBefore(node, anchor || null);\n}\nfunction detach(node) {\n    node.parentNode.removeChild(node);\n}\nfunction element(name) {\n    return document.createElement(name);\n}\nfunction text(data) {\n    return document.createTextNode(data);\n}\nfunction attr(node, attribute, value) {\n    if (value == null)\n        node.removeAttribute(attribute);\n    else if (node.getAttribute(attribute) !== value)\n        node.setAttribute(attribute, value);\n}\nfunction children(element) {\n    return Array.from(element.childNodes);\n}\nfunction attribute_to_object(attributes) {\n    const result = {};\n    for (const attribute of attributes) {\n        result[attribute.name] = attribute.value;\n    }\n    return result;\n}\n\nlet current_component;\nfunction set_current_component(component) {\n    current_component = component;\n}\n\nconst dirty_components = [];\nconst binding_callbacks = [];\nconst render_callbacks = [];\nconst flush_callbacks = [];\nconst resolved_promise = Promise.resolve();\nlet update_scheduled = false;\nfunction schedule_update() {\n    if (!update_scheduled) {\n        update_scheduled = true;\n        resolved_promise.then(flush);\n    }\n}\nfunction add_render_callback(fn) {\n    render_callbacks.push(fn);\n}\nlet flushing = false;\nconst seen_callbacks = new Set();\nfunction flush() {\n    if (flushing)\n        return;\n    flushing = true;\n    do {\n        // first, call beforeUpdate functions\n        // and update components\n        for (let i = 0; i < dirty_components.length; i += 1) {\n            const component = dirty_components[i];\n            set_current_component(component);\n            update(component.$$);\n        }\n        set_current_component(null);\n        dirty_components.length = 0;\n        while (binding_callbacks.length)\n            binding_callbacks.pop()();\n        // then, once components are updated, call\n        // afterUpdate functions. This may cause\n        // subsequent updates...\n        for (let i = 0; i < render_callbacks.length; i += 1) {\n            const callback = render_callbacks[i];\n            if (!seen_callbacks.has(callback)) {\n                // ...so guard against infinite loops\n                seen_callbacks.add(callback);\n                callback();\n            }\n        }\n        render_callbacks.length = 0;\n    } while (dirty_components.length);\n    while (flush_callbacks.length) {\n        flush_callbacks.pop()();\n    }\n    update_scheduled = false;\n    flushing = false;\n    seen_callbacks.clear();\n}\nfunction update($$) {\n    if ($$.fragment !== null) {\n        $$.update();\n        run_all($$.before_update);\n        const dirty = $$.dirty;\n        $$.dirty = [-1];\n        $$.fragment && $$.fragment.p($$.ctx, dirty);\n        $$.after_update.forEach(add_render_callback);\n    }\n}\nconst outroing = new Set();\nfunction transition_in(block, local) {\n    if (block && block.i) {\n        outroing.delete(block);\n        block.i(local);\n    }\n}\nfunction mount_component(component, target, anchor, customElement) {\n    const { fragment, on_mount, on_destroy, after_update } = component.$$;\n    fragment && fragment.m(target, anchor);\n    if (!customElement) {\n        // onMount happens before the initial afterUpdate\n        add_render_callback(() => {\n            const new_on_destroy = on_mount.map(run).filter(is_function);\n            if (on_destroy) {\n                on_destroy.push(...new_on_destroy);\n            }\n            else {\n                // Edge case - component was destroyed immediately,\n                // most likely as a result of a binding initialising\n                run_all(new_on_destroy);\n            }\n            component.$$.on_mount = [];\n        });\n    }\n    after_update.forEach(add_render_callback);\n}\nfunction destroy_component(component, detaching) {\n    const $$ = component.$$;\n    if ($$.fragment !== null) {\n        run_all($$.on_destroy);\n        $$.fragment && $$.fragment.d(detaching);\n        // TODO null out other refs, including component.$$ (but need to\n        // preserve final state?)\n        $$.on_destroy = $$.fragment = null;\n        $$.ctx = [];\n    }\n}\nfunction make_dirty(component, i) {\n    if (component.$$.dirty[0] === -1) {\n        dirty_components.push(component);\n        schedule_update();\n        component.$$.dirty.fill(0);\n    }\n    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));\n}\nfunction init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {\n    const parent_component = current_component;\n    set_current_component(component);\n    const $$ = component.$$ = {\n        fragment: null,\n        ctx: null,\n        // state\n        props,\n        update: noop,\n        not_equal,\n        bound: blank_object(),\n        // lifecycle\n        on_mount: [],\n        on_destroy: [],\n        on_disconnect: [],\n        before_update: [],\n        after_update: [],\n        context: new Map(parent_component ? parent_component.$$.context : options.context || []),\n        // everything else\n        callbacks: blank_object(),\n        dirty,\n        skip_bound: false\n    };\n    let ready = false;\n    $$.ctx = instance\n        ? instance(component, options.props || {}, (i, ret, ...rest) => {\n            const value = rest.length ? rest[0] : ret;\n            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {\n                if (!$$.skip_bound && $$.bound[i])\n                    $$.bound[i](value);\n                if (ready)\n                    make_dirty(component, i);\n            }\n            return ret;\n        })\n        : [];\n    $$.update();\n    ready = true;\n    run_all($$.before_update);\n    // `false` as a special case of no DOM component\n    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;\n    if (options.target) {\n        if (options.hydrate) {\n            const nodes = children(options.target);\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.l(nodes);\n            nodes.forEach(detach);\n        }\n        else {\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.c();\n        }\n        if (options.intro)\n            transition_in(component.$$.fragment);\n        mount_component(component, options.target, options.anchor, options.customElement);\n        flush();\n    }\n    set_current_component(parent_component);\n}\nlet SvelteElement;\nif (typeof HTMLElement === 'function') {\n    SvelteElement = class extends HTMLElement {\n        constructor() {\n            super();\n            this.attachShadow({ mode: 'open' });\n        }\n        connectedCallback() {\n            const { on_mount } = this.$$;\n            this.$$.on_disconnect = on_mount.map(run).filter(is_function);\n            // @ts-ignore todo: improve typings\n            for (const key in this.$$.slotted) {\n                // @ts-ignore todo: improve typings\n                this.appendChild(this.$$.slotted[key]);\n            }\n        }\n        attributeChangedCallback(attr, _oldValue, newValue) {\n            this[attr] = newValue;\n        }\n        disconnectedCallback() {\n            run_all(this.$$.on_disconnect);\n        }\n        $destroy() {\n            destroy_component(this, 1);\n            this.$destroy = noop;\n        }\n        $on(type, callback) {\n            // TODO should this delegate to addEventListener?\n            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));\n            callbacks.push(callback);\n            return () => {\n                const index = callbacks.indexOf(callback);\n                if (index !== -1)\n                    callbacks.splice(index, 1);\n            };\n        }\n        $set($$props) {\n            if (this.$$set && !is_empty($$props)) {\n                this.$$.skip_bound = true;\n                this.$$set($$props);\n                this.$$.skip_bound = false;\n            }\n        }\n    };\n}\n\n/* Settings.svelte generated by Svelte v3.37.0 */\n\nfunction create_else_block(ctx) {\n\tlet t;\n\n\treturn {\n\t\tc() {\n\t\t\tt = text(\"Loading...\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, t, anchor);\n\t\t},\n\t\td(detaching) {\n\t\t\tif (detaching) detach(t);\n\t\t}\n\t};\n}\n\n// (7:4) {#if settings }\nfunction create_if_block(ctx) {\n\tlet t;\n\n\treturn {\n\t\tc() {\n\t\t\tt = text(\"Dont need custom settings...\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, t, anchor);\n\t\t},\n\t\td(detaching) {\n\t\t\tif (detaching) detach(t);\n\t\t}\n\t};\n}\n\nfunction create_fragment(ctx) {\n\tlet div;\n\n\tfunction select_block_type(ctx, dirty) {\n\t\tif (/*settings*/ ctx[0]) return create_if_block;\n\t\treturn create_else_block;\n\t}\n\n\tlet current_block_type = select_block_type(ctx);\n\tlet if_block = current_block_type(ctx);\n\n\treturn {\n\t\tc() {\n\t\t\tdiv = element(\"div\");\n\t\t\tif_block.c();\n\t\t\tthis.c = noop;\n\t\t\tattr(div, \"class\", \"container\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, div, anchor);\n\t\t\tif_block.m(div, null);\n\t\t},\n\t\tp(ctx, [dirty]) {\n\t\t\tif (current_block_type !== (current_block_type = select_block_type(ctx))) {\n\t\t\t\tif_block.d(1);\n\t\t\t\tif_block = current_block_type(ctx);\n\n\t\t\t\tif (if_block) {\n\t\t\t\t\tif_block.c();\n\t\t\t\t\tif_block.m(div, null);\n\t\t\t\t}\n\t\t\t}\n\t\t},\n\t\ti: noop,\n\t\to: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(div);\n\t\t\tif_block.d();\n\t\t}\n\t};\n}\n\nfunction instance($$self, $$props, $$invalidate) {\n\tlet { settings } = $$props;\n\n\t$$self.$$set = $$props => {\n\t\tif (\"settings\" in $$props) $$invalidate(0, settings = $$props.settings);\n\t};\n\n\treturn [settings];\n}\n\nclass Settings extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\n\t\tinit(\n\t\t\tthis,\n\t\t\t{\n\t\t\t\ttarget: this.shadowRoot,\n\t\t\t\tprops: attribute_to_object(this.attributes),\n\t\t\t\tcustomElement: true\n\t\t\t},\n\t\t\tinstance,\n\t\t\tcreate_fragment,\n\t\t\tsafe_not_equal,\n\t\t\t{ settings: 0 }\n\t\t);\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"settings\"];\n\t}\n\n\tget settings() {\n\t\treturn this.$$.ctx[0];\n\t}\n\n\tset settings(settings) {\n\t\tthis.$set({ settings });\n\t\tflush();\n\t}\n}\n\nmodule.exports = Settings;\n//# sourceMappingURL=SettingsIcon.js.map\n";

class JuntoSettingsUI {
    settingsIcon() {
        return SettingsIcon;
    }
}

function interactions(a, expression) {
    return [];
}
const activeAgentDurationSecs = 300;
const name = "social-context-channel";
async function create(context) {
    const Holochain = context.Holochain;
    const linksAdapter = new JuntoSocialContextLinkAdapter(context);
    const settingsUI = new JuntoSettingsUI();
    Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }], linksAdapter.handleHolochainSignal.bind(context));
    await linksAdapter.addActiveAgentLink(Holochain);
    setInterval(await linksAdapter.addActiveAgentLink.bind(Holochain), activeAgentDurationSecs * 1000);
    return {
        name,
        linksAdapter,
        settingsUI,
        interactions,
    };
}

exports.default = create;
exports.name = name;
//# sourceMappingURL=bundle.js.map