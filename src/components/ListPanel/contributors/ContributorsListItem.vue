<template>
	<div class="listPanel__item--contributor">
		<div class="listPanel__itemSummary">
			<div class="listPanel__itemIdentity listPanel__itemIdentity--contributor">
				<div class="listPanel__item--contributor__id">
					{{ item.id }}
				</div>
				<div class="listPanel__itemTitle">
					{{ localize(item.givenName) }} {{ localize(item.familyName) }}
				</div>
				<div class="listPanel__itemSubtitle">
					{{ item.email }}
				</div>
			</div>

			<div class="listPanel__itemActions">
				<pkp-button @click="openEditModal(item.id)">
					{{ __('common.edit') }}
				</pkp-button>
				<pkp-button :isWarnable="true" @click="openDeleteModal(item.id)">
					{{ __('common.delete') }}
				</pkp-button>
			</div>

		</div>
	</div>
</template>

<script>
import ajaxError from '@/mixins/ajaxError';
import fetch from '@/mixins/fetch';
import modal from '@/mixins/modal';
import cloneDeep from 'clone-deep';

export default {
	name: 'ContributorsListItem',
	mixins: [fetch, modal, ajaxError],
	props: {
		apiUrl: {
			type: String,
			required: true
		},
		item: {
			type: Object,
			required: true
		},
		form: {
			type: Object,
			required: true
		},
	},
	data() {
		return {
			isExpanded: false,
			mask: null,
			noticeActions: [],
			noticeActionLabels: []
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
			const author = this.item;
			if (typeof author === 'undefined') {
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
					title: this.localize(author.givenName)
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

			// const author = this.items.find(
			// 	x => x.id === id
			// );
			const author = this.item;

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

.listPanel__itemIdentity--submission,
.listPanel__itemExpanded--submission {
	padding-left: 2.5rem;
}

.listPanel__item--submission__id {
	position: absolute;
	top: 0;
	left: 0;
	font-size: @font-tiny;
	line-height: 22px; // Match baseline of title
	color: @text;
}

.listPanel__item--submission__title,
.listPanel__item--submission__author,
.listPanel__item--submission__notice {
	display: block;
	padding-right: 2em;
}

.listPanel__item--submission__author {
	font-weight: @bold;
}

.listPanel__item--submission__notice,
.listPanel__item--submission__reviewerWorkflowLink {
	margin-top: 0.5em;
	font-size: @font-tiny;
	line-height: 1.5em;
	color: @text;

	.fa {
		font-size: @font-sml;
		color: @no;
	}
}

.listPanel__item--submission__notice {
	.-linkButton:not(:last-child) {
		margin-right: 0.5em;
	}
}

.listPanel__item--submission__flags {
	display: inline-block;
	font-size: @font-tiny;
	line-height: 1.5em;

	> * {
		margin-right: 1em;
	}

	.fa {
		margin-right: 0.25em;
		font-size: @font-sml;
		color: @text-light-rgba;
	}
}

.listPanel__item--submission__stage {
	margin-left: 0.5rem;
	margin-right: 0.25rem;
}

.listPanel__itemExpanded--submission {
	margin-top: 1rem;
}

.listPanel__item--submission__reviewDetails {
	margin-top: 0.25em;
	font-size: @font-tiny;
	line-height: 1.5em;
}

.listPanel__item--submission__dueDate {
	margin-right: 1rem;
}

.listPanel__item--submission__reviewComplete .fa {
	color: @yes;
}

[dir='rtl'] {
	.listPanel__itemIdentity--submission {
		padding-left: 0rem;
		padding-right: 2.5rem;
	}

	.listPanel__item--submission__id {
		position: absolute;
		left: auto;
		right: 0;
		text-align: left;
	}
}
</style>
