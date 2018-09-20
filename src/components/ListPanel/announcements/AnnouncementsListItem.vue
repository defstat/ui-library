<template>
	<li class="pkpListPanelItem pkpListPanelItem--announcement">
		<div class="pkpListPanelItem--announcement__item">
			{{ item.title }}
		</div>
	</li>
</template>

<script>
import ListPanelItem from '@/components/ListPanel/ListPanelItem.vue';

export default {
	extends: ListPanelItem,
	name: 'AnnouncementsListItem',
	props: ['item', 'i18n'],
};
</script>


<style lang="less">
@import '../../../styles/_import';

</style>
