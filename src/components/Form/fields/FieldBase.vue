<script>
import FieldError from '../FieldError.vue';
import FormFieldLabel from '../FormFieldLabel.vue';
import HelpButton from '@/components/HelpButton/HelpButton.vue';
import Tooltip from '@/components/Tooltip/Tooltip.vue';
import MultilingualProgress from '@/components/MultilingualProgress/MultilingualProgress.vue';

export default {
	name: 'FieldBase',
	components: {
		FieldError,
		FormFieldLabel,
		HelpButton,
		Tooltip,
		MultilingualProgress,
	},
	props: {
		name: String,
		component: String,
		label: String,
		description: String,
		tooltip: String,
		helpTopic: String,
		groupId: String,
		formId: String,
		isMultilingual: Boolean,
		isRequired: Boolean,
		showWhen: [String, Array],
		validateAs: String,
		localeKey: String,
		locales: Array,
		value: {
			required: true,
		},
		errors: Array,
		i18n: Object,
	},
	computed: {
		currentValue: {
			get: function () {
				return this.isMultilingual ? this.value[this.localeKey] : this.value;
			},
			set: function (newVal) {
				this.$emit('change', {
					name: this.name,
					value: newVal,
					localeKey: this.localeKey,
				});
			},
		},
		/**
		 * A localized field name
		 *
		 * It will append the appropriate `localeKey` to the `name` property if this
		 * is a multilingual field.
		 *
		 * @return string
		 */
		localizedName: function () {
			return this.isMultilingual ? (this.name + '-' + this.localeKey) : this.name;
		},

		/**
		 * A unique id for the label and control
		 *
		 * @return string
		 */
		controlId: function () {
			return this.compileId('control');
		},

		/**
		 * A unique id for the field's tooltip
		 *
		 * @return string
		 */
		describedByTooltipId: function () {
			return this.compileId('tooltip');
		},

		/**
		 * A unique id for the field's help link button
		 *
		 * @return string
		 */
		describedByHelpId: function () {
			return this.compileId('help');
		},

		/**
		 * A unique id for the field's description
		 *
		 * @return string
		 */
		describedByDescriptionId: function () {
			return this.compileId('description');
		},

		/**
		 * A unique id for the field's error message
		 *
		 * @return string
		 */
		describedByErrorId: function () {
			return this.compileId('error');
		},

		/**
		 * A unique id for the field's multilingual progress indicator
		 *
		 * @return string
		 */
		multilingualProgressId: function () {
			return this.compileId('multingualProgress');
		},

		/**
		 * IDs of the elements which describe this field.
		 *
		 * This is used in the aria-describedby attribute for accessibility.
		 *
		 * @return string
		 */
		describedByIds: function () {
			let ids = [];
			if (this.description) {
				ids.push(this.describedByDescriptionId);
			}
			if (this.tooltip) {
				ids.push(this.describedByTooltipId);
			}
			if (this.helpTopic) {
				ids.push(this.describedByHelpId);
			}
			if (this.error) {
				ids.push(this.describedByErrorId);
			}
			if (this.isMultilingual) {
				ids.push(this.multilingualProgressId);
			}
			return ids.length ? ids.join(' ') : false;
		},

		/**
		 * Count of multilingual fields completed
		 *
		 * If this is a multilingual field, it will return the number of locales
		 * with values. Otherwise it will return 0.
		 *
		 * @return Number
		 */
		multilingualFieldsCompleted: function () {
			if (!this.isMultilingual) {
				return 0;
			}
			return Object.values(this.value).filter((val) => {
				if (Array.isArray(val)) {
					return val.length;
				}
				return val;
			}).length;
		},

		/*
		 * Is this a multilingual field and is this the primary locale?
		 *
		 * @return Boolean
		 */
		isPrimaryLocale: function () {
			return !this.isMultilingual || this.localeKey === $.pkp.app.primaryLocale;
		},

		/**
		 * The label for this field
		 *
		 * For multilingual fields, the secondary languages will indicate the
		 * locale name in the label.
		 *
		 * @return string
		 */
		localeLabel: function () {
			if (!this.isMultilingual || this.isPrimaryLocale) {
				return '';
			}
			return this.locales.find((locale) => locale.key === this.localeKey).label;
		},

		/**
		 * For multilingual fields, the secondary languages need a hidden label for
		 * screenreaders that indicates the language as well as the original field
		 * label.
		 *
		 * @return string
		 */
		multilingualLabel: function () {
			return this.__('multilingualLabel', {label: this.label, localeName: this.localeLabel});
		},
	},
	methods: {
		/**
		 * Helper function to compile unique IDs for labels and aria-describedby
		 * attributes.
		 *
		 * @param string type The type of ID you want to generate (eg - `tooltip`)
		 * @return string
		 */
		compileId: function (type) {
			let parts = [this.formId, this.name, type];
			if (this.isMultilingual) {
				parts.push(this.localeKey);
			}
			return parts.join('-');
		},
	},
};
</script>

<style lang="less">
@import '../../../styles/_import';

.pkpFormField__heading {
	line-height: @line-sml;
}

.pkpFormField__description {
	font-size: @font-sml;
	line-height: 1.8em;
}

.pkpFormField__control {
	position: relative;
	margin-top: 0.25rem;
}

// Should be used for any text input and select fields to ensure consistency
.pkpFormField__input {
	display: block;
	height: 2.5rem; // browser-compatibility for select fields
	background-color: @lift;
	padding: 0 0.5em;
	font-size: @font-sml;
	line-height: 2.5rem;
	border: @bg-border;
	border-radius: 2px;
	padding: 0 1em;
}

.pkpFormField__input:hover {
	border-color: @shade;
}

.pkpFormField__input:focus {
	border-color: @primary;
	box-shadow: inset 3px 0 0 @primary;
}
</style>