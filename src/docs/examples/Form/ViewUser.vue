<template>
	<div>
		<pkp-form
			v-bind="forms.user"
			@set-errors="setFormErrors"
			@set-active-locales="setFormActiveLocales"
		/>
	</div>
</template>

<script>
import PkpForm from '@/components/Form/Form.vue';
import FormUser from './implementations/helpers/form-user';

export default {
	name: 'ViewForm',
	components: {
		PkpForm,
	},
	data: function () {
		return {
			forms: {
				[FormUser.id]: FormUser,
			},
		};
	},
	methods: {
		/**
		 * Get a form by its id
		 *
		 * @return Object
		 */
		getForm: function (formId) {
			return this.forms[formId] ? this.forms[formId] : false;
		},

		/**
		 * Set the errors in the form
		 */
		setFormErrors: function (formId, errors) {
			if (this.getForm(formId)) {
				this.getForm(formId).errors = errors;
			}
		},

		/**
		 * Set the errors in the form
		 */
		setFormActiveLocales: function (formId, activeLocales) {
			if (this.getForm(formId)) {
				this.getForm(formId).activeLocales = activeLocales;
			}
		},
	},
};
</script>
