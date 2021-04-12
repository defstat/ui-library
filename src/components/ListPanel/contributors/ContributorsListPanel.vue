<template>
	<div class="contributorsListPanel">
		<slot>
			<list-panel :items="items">
				<pkp-header slot="header">
					<h2>{{ title }}</h2>
					<spinner v-if="isLoading" />
					<template slot="actions">
						<pkp-button @click="openAddModal">
							{{ addContributorLabel }}
						</pkp-button>
					</template>
				</pkp-header>
				<template v-slot:itemTitle="{item}">
					{{ localize(item.givenName) }} {{ localize(item.familyName) }}
				</template>
				<template v-slot:itemSubtitle="{item}">
					{{ item.email }}
				</template>
				<template v-slot:itemActions="{item}">
					<!-- if the primaryAuthorId if the item.id -->
					<badge v-if="primaryAuthorId == item.id">
						Primary Contact
					</badge>

					<pkp-button @click="openEditModal(item.id)">
						{{ __('common.edit') }}
					</pkp-button>
					<pkp-button :isWarnable="true" @click="openDeleteModal(item.id)">
						{{ __('common.delete') }}
					</pkp-button>
				</template>
			</list-panel>
			<modal v-bind="MODAL_PROPS" name="form" @closed="formModalClosed">
				<modal-content
					:closeLabel="__('common.close')"
					modalName="form"
					:title="activeFormTitle"
				>
					<pkp-form
						v-bind="activeForm"
						@set="updateForm"
						@success="formSuccess"
					/>
				</modal-content>
			</modal>
		</slot>
	</div>
</template>

<script>
import ListPanel from '@/components/ListPanel/ListPanel.vue';
import PkpForm from '@/components/Form/Form.vue';
import PkpHeader from '@/components/Header/Header.vue';
import ajaxError from '@/mixins/ajaxError';
import fetch from '@/mixins/fetch';
import modal from '@/mixins/modal';
import cloneDeep from 'clone-deep';
// import ContributorsListItem from '@/components/ListPanel/contributors/ContributorsListItem.vue';

export default {
	components: {
		ListPanel,
		PkpForm,
		PkpHeader,
		// ContributorsListItem
	},
	mixins: [fetch, modal, ajaxError],
	props: {
		addContributorLabel: {
			type: String,
			required: true
		},
		confirmDeleteMessage: {
			type: String,
			required: true
		},
		deleteContributorLabel: {
			type: String,
			required: true
		},
		editContributorLabel: {
			type: String,
			required: true
		},
		form: {
			type: Object,
			required: true
		},
		id: {
			type: String,
			required: true
		},
		items: {
			type: Array,
			default() {
				return [];
			}
		},
		title: {
			type: String,
			required: true
		},
		primaryAuthorId: {
			type: Number,
			required: true
		}
	},
	data() {
		return {
			activeForm: null,
			activeFormTitle: '',
			resetFocusTo: null
		};
	},
	methods: {
		/**
		 * Clear the active form when the modal is closed
		 *
		 * @param {Object} event
		 */
		formModalClosed(event) {
			this.activeForm = null;
			this.activeFormTitle = '';
			if (this.resetFocusTo) {
				this.resetFocusTo.focus();
			}
		},

		/**
		 * The add/edit form has been successfully
		 * submitted.
		 *
		 * @param {Object} item
		 */
		formSuccess(item) {
			if (this.activeForm.method === 'POST') {
				this.offset = 0;
				this.get();
				pkp.eventBus.$emit('add:contributor', item);
			} else {
				this.setItems(
					this.items.map(i => (i.id === item.id ? item : i)),
					this.itemsMax
				);
				pkp.eventBus.$emit('update:contributor', item);
			}
			this.$modal.hide('form');
		},

		/**
		 * Open the modal to add an item
		 */
		openAddModal() {
			this.resetFocusTo = document.activeElement;
			let activeForm = cloneDeep(this.form);
			activeForm.action = this.apiUrl;
			activeForm.method = 'POST';
			this.activeForm = activeForm;
			this.activeFormTitle = this.addContributorLabel;
			this.$modal.show('form');
		},

		/**
		 * Open delete modal
		 *
		 * @param {Number} id
		 */
		openDeleteModal(id) {
			const announcement = this.items.find(a => a.id === id);
			if (typeof announcement === 'undefined') {
				this.openDialog({
					confirmLabel: this.__('common.ok'),
					modalName: 'unknownError',
					message: this.__('common.unknownError'),
					title: this.__('common.error'),
					callback: () => {
						this.$modal.hide('unknownError');
					}
				});
				return;
			}
			this.openDialog({
				cancelLabel: this.__('common.no'),
				modalName: 'delete',
				title: this.deleteContributorLabel,
				message: this.replaceLocaleParams(this.confirmDeleteMessage, {
					title: this.localize(announcement.title)
				}),
				callback: () => {
					var self = this;
					$.ajax({
						url: this.apiUrl + '/' + id,
						type: 'POST',
						headers: {
							'X-Csrf-Token': pkp.currentUser.csrfToken,
							'X-Http-Method-Override': 'DELETE'
						},
						error: self.ajaxErrorCallback,
						success: function(r) {
							self.setItems(
								self.items.filter(i => i.id !== id),
								self.itemsMax
							);
							self.$modal.hide('delete');
							self.setFocusIn(self.$el);
						}
					});
				}
			});
		},

		/**
		 * Open the modal to edit an item
		 *
		 * @param {Number} id
		 */
		openEditModal(id) {
			this.resetFocusTo = document.activeElement;

			const author = this.items.find(
				x => x.id === id
			);

			if (!author) {
				this.openDialog({
					confirmLabel: this.__('common.ok'),
					modalName: 'unknownError',
					message: this.__('common.unknownError'),
					callback: () => {
						this.$modal.hide('unknownError');
					}
				});
			}

			let activeForm = cloneDeep(this.form);
			activeForm.action = this.apiUrl + '/' + id;
			activeForm.method = 'PUT';
			activeForm.fields = activeForm.fields.map(field => {
				if (Object.keys(author).includes(field.name)) {
					field.value = author[field.name];
				}
				return field;
			});
			this.activeForm = activeForm;
			this.activeFormTitle = this.editContributorLabel;
			this.$modal.show('form');
		},

		/**
		 * Set the list of items
		 *
		 * @see @/mixins/fetch.js
		 * @param {Array} items
		 * @param {Number} itemsMax
		 */
		setItems(items, itemsMax) {
			this.$emit('set', this.id, {
				items,
				itemsMax
			});
		},

		/**
		 * Update form values when they change
		 *
		 * @param {String} formId
		 * @param {Object} data
		 */
		updateForm(formId, data) {
			let activeForm = {...this.activeForm};
			Object.keys(data).forEach(function(key) {
				activeForm[key] = data[key];
			});
			this.activeForm = activeForm;
		}
	}
};
</script>

<style lang="less">
@import '../../../styles/_import';

.listPanel__itemIdentity--contributor,
.listPanel__itemExpanded--contributor {
	padding-left: 2.5rem;
}

.listPanel__item--contributor__id {
	position: absolute;
	top: 0;
	left: 0;
	font-size: @font-tiny;
	line-height: 22px; // Match baseline of title
	color: @text;
}

.listPanel__item--contributor__title {
	display: block;
	padding-right: 2em;
}

[dir='rtl'] {
	.listPanel__itemIdentity--contributor {
		padding-left: 0rem;
		padding-right: 2.5rem;
	}

	.listPanel__item--contributor__id {
		position: absolute;
		left: auto;
		right: 0;
		text-align: left;
	}
}
</style>
