<script>
import PkpForm from '../Form.vue';

export default {
	name: 'ThemeForm',
	extends: PkpForm,
	props: {
		themeFields: Object,
	},
	methods: {
		/**
		 * @copydoc Form::fieldChanged()
		 */
		fieldChanged: function (data) {
			let newFields = this.fields.map((field) => {
				if (field.name === data.name) {
					if (data.localeKey) {
						field.value[data.localeKey] = data.value;
					} else {
						field.value = data.value;
					}
				}
				return field;
			});
			if (data.name === 'themePluginPath') {
				const themeOptionFields = this.themeFields[data.value] || [];
				newFields = [
					newFields[0],
					...themeOptionFields,
				];
			}
			this.$emit('set-fields', this.id, newFields);
			this.removeError(data.name, data.localeKey);
		},
	},
};
</script>
