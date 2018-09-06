<script type="text/javascript">
import PkpForm from '@/components/Form/Form.vue';

export default {
	name: 'Container',
	components: {
		PkpForm,
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
		 * Respond to a successful form submission
		 *
		 * @param string formId
		 * @param mixed r The response from the server. This will typically be a
		 *  representation of the object that was added/modified by the form.
		 */
		onFormSuccess: function (formId, r) {
			if (!this.forms[formId]) {
				return;
			}
			// Update form values with the response values
			this.forms[formId].fields.map(field => {
				if (typeof r[field.name] !== 'undefined') {
					field.value = r[field.name];
				}
				return field;
			});
			this.scrollTo();
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

		/**
		 * Scroll to the top
		 */
		scrollTo: function () {
			this.$scrollTo(this.$el, 500, {
				offset: -50,
			});
		},
	},
};
</script>
