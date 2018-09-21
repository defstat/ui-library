<template>
	<div class="pkpListPanel pkpListPanel--announcements" :class="classStatus">
		<div class="pkpListPanel__header -pkpClearfix">
			<div class="pkpListPanel__title">
				{{ i18n.title }}
				<span v-if="isLoading" class="pkpSpinner" aria-hidden="true"></span>
			</div>
			<ul class="pkpListPanel__actions">
				<li>
					<pkp-button
						element="a"
						:href="addUrl"
						:label="i18n.add"
					/>
				</li>
			</ul>
			<list-panel-search
				@searchPhraseChanged="setSearchPhrase"
				:searchPhrase="searchPhrase"
				:i18n="i18n"
			/>
		</div>
		<div class="pkpListPanel__body -pkpClearfix">
			<div class="pkpListPanel__content">
				<ul class="pkpListPanel__items" aria-live="polite">
					<announcements-list-item
						v-for="item in items"
						@filterList="updateFilter"
						:key="item.id"
						:item="item"
						:i18n="i18n"
					/>
				</ul>
			</div>
		</div>
		<div class="pkpListPanel__footer -pkpClearfix">
			<list-panel-load-more
				v-if="canLoadMore"
				@loadMore="loadMore"
				:isLoading="isLoading"
				:i18n="i18n"
			/>
			<list-panel-count
				:count="itemCount"
				:total="this.itemsMax"
				:i18n="i18n"
			/>
		</div>
	</div>
</template>

<script>
import ListPanel from '@/components/ListPanel/ListPanel.vue';
import ListPanelSearch from '@/components/ListPanel/ListPanelSearch.vue';
import ListPanelCount from '@/components/ListPanel/ListPanelCount.vue';
import ListPanelLoadMore from '@/components/ListPanel/ListPanelLoadMore.vue';
import AnnouncementsListItem from '@/components/ListPanel/announcements/AnnouncementsListItem.vue';
import PkpButton from '@/components/Button/Button.vue';

export default {
	extends: ListPanel,
	name: 'AnnouncementsListPanel',
	components: {
		ListPanelSearch,
		ListPanelCount,
		ListPanelLoadMore,
		AnnouncementsListItem,
		PkpButton,
	},
	data: function () {
		return {};
	},
};
</script>
