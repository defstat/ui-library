<script>
import AnnouncementsListPanel from '@/components/ListPanel/announcements/AnnouncementsListPanel.vue';

export default {
	extends: AnnouncementsListPanel,
	name: 'ExampleAnnouncementsListPanel',
	data: function () {
		return {
			id: 'ExampleAnnouncementsListPanel',
			searchPhrase: '',
			isLoading: false,
			isOrdering: false,
			isFilterVisible: false,
			count: 3,
			offset: 0,
			apiPath: '',
			getParams: {},
			lazyLoad: false,
			_lastGetRequest: null,
			items: [
				{
					id: 1,
					title: 'My announcement',
					datePublished: '2018-08-02',
					type: '',
					dateExpiry: '2019-02-02',
				},
				{
					id: 2,
					title: 'My announcement 2',
					datePublished: '2018-08-02',
					type: '',
					dateExpiry: '2019-02-02',
				},
				{
					id: 3,
					title: 'My announcement 3',
					datePublished: '2018-08-02',
					type: '',
					dateExpiry: '2019-02-02',
				},
			],
			itemsMax: 3,
			i18n: {
				id: 'ID',
				title: 'Announcements',
				add: 'Add Announcement',
				search: 'Search',
				itemsOfTotal: '{$count} of {$total} announcements',
				itemCount: '{$count} announcements',
				loadMore: 'Load more',
				loading: 'Loading',
			},
		};
	},
};
</script>
