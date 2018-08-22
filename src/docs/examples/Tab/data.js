import ViewTab from './ViewTab.vue';
import NestedTabs from './NestedTabs.vue';
import NestedTabsRaw from '!!raw-loader!./NestedTabs.vue';
import NestedSideTabs from './NestedSideTabs.vue';
import NestedSideTabsRaw from '!!raw-loader!./NestedSideTabs.vue';

export default {
	viewComponent: ViewTab,
	baseComponent: ViewTab,
	dataDesc: {
	},
	propDescription: {
	},
	examples: {
		'nested-tabs': {
			label: 'Nested Tabs',
			component: NestedTabs,
			componentRaw: NestedTabsRaw,
		},
		'nested-side-tabs': {
			label: 'Nested Tabs (Side)',
			component: NestedSideTabs,
			componentRaw: NestedSideTabsRaw,
		},
	},
};
