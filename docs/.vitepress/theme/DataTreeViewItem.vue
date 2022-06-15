<template>
  <div class="data-tree-item">
    <div v-if="data.type === 'object' || data.type === 'array'">
      <div v-if="data.key != '/'" class="data-key">
            <code>{{ data.key }}</code>
            <span class="value-type">{{ data.type }}</span>
            <span class="value-tag">{{ data.required ? 'REQUIRED' : '' }}</span>
            <span class="value-tag">{{ data.mutable ? '' : 'IMMUTABLE' }}</span>
            <div class="object-description">{{ data.description }}</div>
          <button
            v-if="data.type === 'object' || data.arrayType === 'object' || data.arrayType === 'array'"
            class="property-toggle"
            :aria-expanded="state.open ? 'true' : 'false'"
            @click.stop="toggleOpen"
            >
            <!-- <code>{{ data.key }}</code>
            <span class="value-type">{{ data.type }}</span>
            <span class="value-tag">{{ data.required ? 'REQUIRED' : '' }}</span>
            <span class="value-tag">{{ data.mutable ? '' : 'IMMUTABLE' }}</span> -->
            <!-- <span class="properties">{{ lengthString }}</span> -->
            <div :class="classes"></div>
            {{ state.open ? 'Hide properties' : 'Show properties'}}
        </button>
      </div>

      <DataTreeViewItem
        v-show="state.open"
        v-for="child in data.children"
        :key="getKey(child)"
        :data="child"
        :maxDepth="maxDepth"
        :canSelect="canSelect"
        @selected="bubbleSelected"
      />
    </div>
    <div
      v-else
      :style="valueStyle"
      :class="valueClasses"
      :role="canSelect ? 'button' : undefined"
      :tabindex="canSelect ? '0' : undefined"
      @click="onClick(data)"
      @keyup.enter="onClick(data)"
      @keyup.space="onClick(data)"
    >
       <span class="value-key"><code>{{ data.key }}</code></span>
       <span class="value-type">{{ data.type }}</span>
       <span class="value-tag">{{ data.required ? 'REQUIRED' : '' }}</span>
       <span class="value-tag">{{ data.mutable ? '' : 'IMMUTABLE' }}</span>
       <div class="value-description">{{ data.description }}</div>

    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  reactive,
  SetupContext,
} from "vue";
import { then, when } from "switch-ts";

export interface SelectedData {
  key: string;
  value: string;
  path: string;
}
export interface Data {
  [key: string]: string;
}

export enum ItemType {
  OBJECT,
  ARRAY,
  VALUE,
}

export type ValueTypes =
  | unknown
  | string
  | number
  | bigint
  | boolean
  | undefined;

export type ItemData = {
  key: string;
  type: string;
  arrayType?: string;
  required?: boolean;
  mutable?: boolean;
  description?: string;
  path: string;
  depth: number;
  length?: number;
  children?: ItemData[];
};

type Props = {
  data: ItemData;
  maxDepth: number;
  canSelect: boolean;
};

export default defineComponent({
  name: "DataTreeViewItem",
  props: {
    data: {
      required: true,
      type: Object as PropType<ItemData>,
    },
    maxDepth: {
      type: Number,
      required: false,
      default: 1,
    },
    canSelect: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props: Props, context: SetupContext) {
    const state = reactive({
      open: props.data.depth < props.maxDepth,
    });

    function toggleOpen(): void {
      state.open = !state.open;
    }

    function onClick(data: Data): void {
      context.emit("selected", {
        key: data.key,
        value: data.value,
        path: data.path,
      } as SelectedData);
    }

    function bubbleSelected(data: Data): void {
      context.emit("selected", data);
    }

    function getKey(itemDate: ItemData): string {
      const keyValue = Number(itemDate.key);
      return !isNaN(keyValue) ? `${itemDate.key}"` : `"${itemDate.key}"`;
    }

    function getValueColor(value: ValueTypes): string {
      return when(typeof value)
        .is((v) => v === "string", then("var(--jtv-string-color)"))
        .is((v) => v === "number", then("var(--jtv-number-color)"))
        .is((v) => v === "bigint", then("var(--jtv-number-color)"))
        .is((v) => v === "boolean", then("var(--jtv-boolean-color)"))
        .is((v) => v === "object", then("var(--jtv-null-color)"))
        .is((v) => v === "undefined", then("var(--jtv-null-color)"))
        .default(then("var(--jtv-valueKey-color)"));
    }


    const classes = computed((): unknown => {
      return {
        "chevron-arrow": true,
        opened: state.open,
      };
    });
    const valueClasses = computed((): unknown => {
      return {
        "value-key": true,
        "can-select": props.canSelect,
      };
    });
    const valueStyle = computed((): unknown => {

     if(props.data.depth > 1) {
        let margin = (props.data.depth - 1) *36;
        let border = "border-left-color: #D2D2D2 !important;border-left-style: solid;border-left-width: 0.15px !important;";
        return `margin-left:${margin}px; ${border}`;
     } else {
         return '';
     }
    });
    const lengthString = computed((): string => {
      const length = props.data.length;
      if (props.data.type === ItemType.ARRAY) {
        return length === 1 ? `(${length} element)` : `(${length} elements)`;
      }
      return length === 1 ? `(${length} property)` : `(${length} properties)`;
    });


    return {
      state,
      toggleOpen,
      onClick,
      bubbleSelected,
      getKey,
      getValueColor,
      classes,
      valueStyle,
      valueClasses,
      lengthString,
      ItemType,
    };
  },
});
</script>

<style lang="css">
.root-item {
    margin-left: 0px;
}

.data-tree-item:not(.root-item) {
    /* margin-left: 25px; */
    border-left-color: #eaeaea;
    /* border-left-style: solid; */
    /* border-left-width: 1px; */
}
.value-key {
  font-size: 16px;
  border-radius: 2px;
  white-space: nowrap;
  padding: 5px 5px 5px 10px;
}
.value-type {
     font-size: 15px;
     font-family:SF Mono,Inconsolata,Menlo,Courier,monospace;
	 font-weight: 400;
	 margin-left: 5px;
   margin-right: 10px;
	 border-radius: 2px;
	 white-space: nowrap;

}
.value-description {
  border-radius: 2px;
  font-size: 16px;
  font-weight: 400;
  letter-spacing:0.15px;
  margin-left: 10px;
  padding: 5px 5px 5px 10px;
  white-space: normal;
}
.object-description {
     font-size: 16px;
	 font-weight: 400;
     letter-spacing:0.15px;
	 border-radius: 2px;
	 white-space: normal;
	 padding: 5px 5px 5px 10px;
}
 .value-key.can-select {
	 cursor: pointer;
}
 .value-key.can-select:hover {
	 background-color: rgba(0, 0, 0, 0.08);
}
 .value-key.can-select:focus {
	 outline: 2px solid var(--jtv-hover-color);
}
.value-tag{
    font-size: 14px;
    color:#BD4B27;
    font-family:SF Mono,Inconsolata,Menlo,Courier,monospace;
}
 .data-key {
     margin-left: 15px;
     font-size: 16px;
	 align-items: center;
	 background-color: transparent;
	 border-radius: 2px;
	 border: 0;
	 color: inherit;
	 cursor: pointer;
	 display: block;
	 font-family: inherit;
	 font-size: inherit;
	 font-weight: inherit;
	 padding: 5px;
	 white-space: nowrap;
	 width: 100%;
}

.property-toggle{
    align-items: center;
    background-color: transparent;
    border-radius: 2px;
    border: 0;
    color: #BD4B27;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    font-size: 15px;
    font-weight: inherit;
    margin-left: 5px;
    padding-left:0px;
    padding: 5px;
    white-space: nowrap;
    width: 100%;
}

 .data-key:hover {
	 /* background-color: var(--jtv-hover-color); */
}
 .data-key:focus {
	 /* outline: 2px solid var(--jtv-hover-color); */
}
 .data-key::-moz-focus-inner {
	 /* border: 0; */
}
 .data-key .properties {
     font-size: 16px;
	 font-weight: 300;
	 opacity: 0.9;
	 margin-left: 4px;
	 user-select: none;
}
 .chevron-arrow {
	 flex-shrink: 0;
	 border-right: 2px solid var(--jtv-arrow-color);
	 border-bottom: 2px solid var(--jtv-arrow-color);
	 width: var(--jtv-arrow-size);
	 height: var(--jtv-arrow-size);
	 margin-right: 10px;
	 margin-left: 5px;
	 transform: rotate(-45deg);
}
 .chevron-arrow.opened {
	 margin-top: -3px;
	 transform: rotate(45deg);
}

</style>