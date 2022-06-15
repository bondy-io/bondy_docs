<!-- From https://github.com/seijikohara/json-tree-view-vue3/blob/main/src/components/JsonTreeView.vue -->
<template>
  <DataTreeViewItem
    :class="[{ 'data-tree-item': true, dark: colorScheme === 'dark' }]"
    :data="parsed"
    :maxDepth="maxDepth"
    @selected="itemSelected"
  />
</template>

<script lang="ts">
import { computed, defineComponent, SetupContext } from "vue";

import DataTreeViewItem, {
  ItemType,
  ValueTypes,
  ItemData,
} from "./DataTreeViewItem.vue";

type Props = {
  data?: string;
  rootKey: string;
  maxDepth: number;
  colorScheme: string;
};

export default defineComponent({
  name: "DataTreeView",
  components: { DataTreeViewItem },
  props: {
    data: {
      type: String,
      required: false,
    },
    rootKey: {
      type: String,
      required: false,
      default: "/",
    },
    maxDepth: {
      type: Number,
      required: false,
      default: 1,
    },
    colorScheme: {
      type: String,
      required: false,
      default: "light",
      validator: (value: string) => ["light", "dark"].indexOf(value) !== -1,
    },
  },
  setup(props: Props, context: SetupContext) {
    function itemSelected(data: unknown): void {
      context.emit("selected", data);
    }

    function build(
      key: string,
      value: Object,
      depth: number,
      path: string,
      includeKey: boolean
    ): ItemData {
      if (value instanceof Object) {
        const schemaType = value.type;

        if(schemaType === undefined) {
            // root object
            const children =
                Object.entries(value).map(([childKey, childValue]) =>
                    build(
                        childKey,
                        childValue,
                        depth + 1,
                        includeKey ? `${path}${key}.` : `${path}`,
                        true
                    )
                );

            return {
                key,
                type: "object",
                required: value.required ?? false,
                mutable: value.mutable ?? true,
                description: value.description ?? "",
                depth,
                path,
                length: children.length,
                children: children,
            };

        } else if (schemaType === 'array') {

            if(value.items.type === 'object') {
                const children =
                    Object
                        .entries(value.items.properties)
                        .map(([childKey, childValue]) =>
                            build(
                                childKey,
                                childValue,
                                depth + 1,
                                includeKey ? `${path}${key}.` : `${path}`,
                                true
                            )
                    );

                return {
                    key,
                    type: 'array',
                    arrayType: value.items.type,
                    required: value.required ?? false,
                    mutable: value.mutable ?? true,
                    description: value.description ?? "",
                    default: value.default,
                    depth,
                    path,
                    length: children.length,
                    children,
                };
            } else {
                return {
                    key,
                    type: 'array',
                    arrayType: value.items.type,
                    required: value.required ?? false,
                    mutable: value.mutable ?? true,
                    description: value.description ?? "",
                    default: value.default,
                    path: includeKey ? `${path}${key}` : path.slice(0, -1),
                    depth
                };

            };


        } else if (schemaType === 'object') {
            const children =
                Object.entries(value.properties).map(([childKey, childValue]) =>
                    build(
                        childKey,
                        childValue,
                        depth + 1,
                        includeKey ? `${path}${key}.` : `${path}`,
                        true
                    )
                );

            return {
                key,
                type: 'object',
                required: value.required ?? false,
                mutable: value.mutable ?? true,
                description: value.description ?? "",
                depth,
                path,
                length: children.length,
                children: children,
            };

        } else {
            // Value types
            return {
                key,
                type: schemaType,
                required: value.required ?? false,
                mutable: value.mutable ?? true,
                description: value.description ?? "",
                default: value.default,
                path: includeKey ? `${path}${key}` : path.slice(0, -1),
                depth
            };
        }

      } else {

        return {
          key,
          type: 'string',
          path: includeKey ? `${path}${key}` : path.slice(0, -1),
          depth,
        };

      }
    }

    const parsed = computed(
      (): ItemData => {
        const json = props.data;
        if (json != null && json != undefined) {
          const data = JSON.parse(json);
          if (data instanceof Object) {
              return build(props.rootKey, { ...data }, 0, "", true);;
          }
        }
        throw new Error('Not a valid schema object: ' + json);
      }
    );

    return {itemSelected, parsed};
  },
});
</script>


<style lang="css" scoped>
.data-tree-item {
  --jtv-key-color: #0977e6;
  --jtv-valueKey-color: #073642;
  --jtv-string-color: #268bd2;
  --jtv-number-color: #2aa198;
  --jtv-boolean-color: #cb4b16;
  --jtv-null-color: #6c71c4;
  --jtv-arrow-size: 6px;
  --jtv-arrow-color: #444;
  --jtv-hover-color: rgba(0, 0, 0, 0.1);
  margin-left: 0;
  width: 100%;
  height: auto;
}
.data-tree-item.dark {
  --jtv-key-color: #80d8ff;
  --jtv-valueKey-color: #fdf6e3;
  --jtv-hover-color: rgba(255, 255, 255, 0.1);
  --jtv-arrow-color: #fdf6e3;
}
</style>