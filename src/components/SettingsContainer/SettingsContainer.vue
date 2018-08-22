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
