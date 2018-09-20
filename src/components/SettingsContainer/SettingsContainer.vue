<script type="text/javascript">
import PkpForm from '@/components/Form/Form.vue';
import ThemeForm from '@/components/Form/theme/ThemeForm.vue';

export default {
	name: 'Container',
	components: {
		PkpForm,
		ThemeForm,
	},
	data: function () {
		return {};
	},
	methods: {
		/**
		 * Get a form by its id
		 *
		 * @param string formId
		 * @return Object
		 */
		getForm: function (formId) {
			return this.forms[formId] ? this.forms[formId] : false;
		},

		/**
		 * Update the fields in a form
		 *
		 * @param string formId
		 * @param array newFields The list of fields to update the form with
		 */
		setFormFields: function (formId, newFields) {
			if (!this.forms[formId]) {
				return;
			}
			this.forms[formId].fields = newFields;
		},

		/**
		 * Set the errors in the form
		 *
		 * @param string formId
		 * @param object errors List of errors to attach to the form
		 */
		setFormErrors: function (formId, errors) {
			if (this.getForm(formId)) {
				this.getForm(formId).errors = errors;
			}
		},

		/**
		 * Set the errors in the form
		 *
		 * @param string formId
		 * @param array activeLocales list of locale keys that should be active
		 */
		setFormActiveLocales: function (formId, activeLocales) {
			if (this.getForm(formId)) {
				this.getForm(formId).activeLocales = activeLocales;
			}
		},
	},
};
</script>
