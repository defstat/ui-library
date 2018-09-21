<template>
	<li class="pkpListPanelItem pkpListPanelItem--announcement">
		<div class="pkpListPanelItem__summary -pkpClearfix">
			<div class="pkpListPanelItem--announcement__mainData">
				<div class="pkpListPanelItem--announcement__item">
					{{ item.title }}
				</div>
				<div v-if="expired" class="pkpListPanelItem--announcement__activity">
					<b>Is Expired:</b> {{ item.dateExpiry }}
				</div>
				<div v-else="expired" class="pkpListPanelItem--announcement__activity">
					Will Expire: {{ item.dateExpiry }}
				</div>
			</div>
			<div class="pkpListPanelItem--announcement__publicationDate">
				<div :aria-labelledby="announcementPublicationDateLabelId" class="pkpListPanelItem--announcement__publicationDateValue">
					{{ item.datePublished }}
				</div>
				<div :id="announcementPublicationDateLabelId" class="pkpListPanelItem--announcement__publicationDateLabel">
					{{ i18n.datePublished }}
				</div>
			</div>
			<button
				@click="toggleExpanded"
				class="pkpListPanelItem__expander"
			>
				<icon v-if="isExpanded" icon="angle-up" />
				<icon v-else icon="angle-down" />
			</button>
		</div>
		<div
			v-if="isExpanded"
			class="pkpListPanelItem__details pkpListPanelItem__details--announcement"
		>
			<div class="pkpListPanelItem--announcement__actions">
				<pkp-button
					:label="i18n.edit"
					@click="openEditForm"
					@focus="focusItem"
					@blur="blurItem"
				/>
				<pkp-button
					:label="i18n.delete"
					:isWarnable="true"
					@click="deleteAnnouncementPrompt"
					@focus="focusItem"
					@blur="blurItem"
				/>
			</div>
		</div>
		<div class="pkpListPanelItem__mask" :class="classMask">
			<div class="pkpListPanelItem__maskLabel">
				<template v-if="mask === 'confirmingDelete'">
					<span class="pkpListPanelItem__maskLabel_prompt">
						{{ i18n.confirmDelete }}
						<a href="#" @click.prevent="deleteAnnouncement">Yes</a>
						<a href="#" @click.prevent="cancelDeleteRequest">No</a>
					</span>
				</template>
			</div>
		</div>
	</li>
</template>

<script>
import PkpButton from '@/components/Button/Button.vue';
import Icon from '@/components/Icon/Icon.vue';
import ListPanelItem from '@/components/ListPanel/ListPanelItem.vue';

export default {
	extends: ListPanelItem,
	name: 'AnnouncementsListItem',
	props: ['item', 'i18n'],
	components: {
		PkpButton,
		Icon,
	},
	data: function () {
		return {
			isExpanded: false,
			mask: null,
			noticeActions: [],
			noticeActionLabels: [],
		};
	},
	computed: {
		expired: function () {
			if (Date.now() > new Date(this.item.dateExpiry)) {
				return true;
			} else {
				return false;
			}
		},
		/**
		 * ID attribute to use in aria-labelledby linking the reponse due date
		 * with it's label
		 *
		 * @return string
		 */
		announcementPublicationDateLabelId: function () {
			return 'announcementPublicationDateLabel' + this._uid;
		},
	},
	methods: {
		/**
		 * Display a confirmation prompt before deleting an Announcement
		 */
		deleteAnnouncementPrompt: function () {
			this.mask = 'confirmingDelete';
		},

		/**
		 * Send a request to delete the Announcement and handle the response
		 */
		deleteAnnouncement: function () {

			this.mask = 'deleting';

			var self = this;
			$.ajax({
				url: this.getApiUrl(this.apiPath + '/' + this.item.id),
				type: 'DELETE',
				error: this.ajaxErrorCallback,
				success: function (r) {
					self.mask = 'finish';
					// Allow time for the finished CSS transition to display
					setTimeout(function () {
						pkp.eventBus.$emit('submissionDeleted', { id: self.item.id });
						self.cancelDeleteRequest();
					}, 300);
				},
				complete: function (r) {
					// Reset the mask in case there is an error
					if (self.mask === 'deleting') {
						self.cancelDeleteRequest();
					}
				},
			});
		},
		/**
		 * Return a class to toggle the item mask
		 *
		 * @return string
		 */
		classMask: function () {
			if (!this.mask) {
				return '';
			} else if (this.mask === 'finish') {
				return '-finish';
			}
			var classes = ['-active'];
			if (this.mask === 'confirmingDelete' || this.mask === 'deleting') {
				classes.push('-alert');
			}

			return classes.join(' ');
		},
		/**
		 * Load a modal displaying history and notes of a submission
		 */
		openEditForm: function () {

			var opts = {
				title: 'Edit',
				titleIcon: 'modal_edit',
				canClose: '1',
				width: '710',
				closeButtonText: 'Close Panel',
				// title: this.item.title,
				url: this.editUrl.replace('__id__', this.item.id),
				closeCallback: this.resetFocusEdit,
			};

			$('<div id="' + $.pkp.classes.Helper.uuid() + '" ' +
					'class="pkp_modal pkpModalWrapper" tabindex="-1"></div>')
				.pkpHandler('$.pkp.controllers.modal.AjaxModalHandler', opts);
		},

		/**
		 * Reset the focus on the info center link when the modal has been
		 * closed. This is a callback function passed into ModalHandler.js
		 */
		resetFocusEdit: function () {
			this.$el.querySelector('.pkpListPanelItem__openEditForm').focus();
		},
	},
};
</script>


<style lang="less">
@import '../../../styles/_import';

.pkpListPanelItem--announcement__mainData {
	float: left;
}

.pkpListPanelItem--announcement__publicationDateValue {
	font-weight: @bold;
}

.pkpListPanelItem--announcement__publicationDateLabel {
	font-size: @font-tiny;
	line-height: @line-tiny;
}

.pkpListPanelItem--announcement__publicationDate {
	/* margin-top: 1em; */
	float: right;
	margin-right: 1em;
}

</style>
