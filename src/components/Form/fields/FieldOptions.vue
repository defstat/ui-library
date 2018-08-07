<template>
	<fieldset class="pkpFormField pkpFormField--options" :class="classes">
		<legend class="pkpFormField--options__legend">
			<template v-if="localeLabel">
				<span class="aria-hidden">{{ localeLabel }}</span>
				<span class="-screenReader">{{ multilingualLabel }}</span>
			</template>
			<template v-else>
				{{ label }}
			</template>
			<span v-if="isRequired" class="pkpFormFieldLabel__required">
				*
				<span class="-screenReader">{{ i18n.required }}</span>
			</span>
			<tooltip v-if="isPrimaryLocale && tooltip" aria-hidden="true" :tooltip="tooltip" label="" />
			<span v-if="isPrimaryLocale && tooltip" class="-screenReader" :id="describedByTooltipId" v-html="tooltip" />
			<help-button v-if="isPrimaryLocale && helpTopic" :id="describedByHelpId" :topic="helpTopic" :label="i18n.help" />
		</legend>
		<div v-if="isPrimaryLocale && description"
			class="pkpFormField__description pkpFormField--options__description"
			v-html="description"
			:id="describedByDescriptionId"
		/>
		<field-error v-if="errors.length" :id="describedByErrorId" :messages="errors" />
		<div class="pkpFormField__control">
			<label v-for="option in localizedOptions" class="pkpFormField--options__option">
				<input
					class="pkpFormField--options__input"
					v-model="selectedValue"
					:value="option.value"
					:type="type"
					:aria-describedby="describedByIds"
					:aria-invalid="!!error"
					:disabled="option.disabled"
				/>
				{{ option.label }}
			</label>
			<multilingual-progress v-if="isMultilingual"
				:id="multilingualProgressId"
				:count="multilingualFieldsCompleted"
				:total="locales.length"
				:i18n="i18n"
			/>
		</div>
	</fieldset>
</template>

<script>
import FieldBase from './FieldBase.vue';

export default {
	name: 'FieldOptions',
	extends: FieldBase,
	props: {
		type: {
			validator: function (value) {
				return ['checkbox', 'radio'].includes(value);
			},
			default: 'checkbox',
		},
		options: {
			type: Array,
			required: true,
		},
		value: {
			type: [Array, String],
			required: true,
		},
	},
	data: function () {
		return {
			/**
			 * This replaces the computed `currentValue` property in FieldBase. We
			 * use a custom watcher for checkboxes so that all change events are
			 * recorded. The setter function for the computed property `currentValue`
			 * is not called when an option is deselected. See:
			 * https://github.com/vuejs/vuex/issues/249
			 */
			selectedValue: this.isMultilingual ? this.value[this.localeKey] : this.value,
		};
	},
	computed: {
		/**
		 * Get classes for the wrapper element
		 *
		 * @return array
		 */
		classes: function () {
			return ['pkpFormField--' + this.type];
		},

		/**
		 * Get localized set of options
		 *
		 * @return array
		 */
		localizedOptions: function () {
			return this.isMultingual ? this.options[this.localeKey] : this.options;
		},
	},
	mounted: function () {

		/**
		 * Whenever the current value changes, emit an event to update the value of
		 * this field in the form component.
		 */
		this.$watch('selectedValue', function (newVal, oldVal) {
			if (newVal === oldVal) {
				return;
			}
			this.$emit('change', {
				name: this.name,
				value: newVal,
				localeKey: this.localeKey,
			});
		});
	},
};
</script>

<style lang="less">
@import '../../../styles/_import';

.pkpFormField--options {
	border: @bg-border;
	border-radius: @radius;
}

.pkpFormField--options__legend {
	padding: 0 @half;
}

.pkpFormField--options__description {
	margin-bottom: @base;
}

.pkpFormField--options__option {
	position: relative;
	display: block;
	padding-left: @base + @half;
	font-size: @font-sml;
	line-height: 1.8em;
	cursor: pointer;

	+ .pkpFormField--options__option {
		margin-top: @half;
	}
}

.pkpFormField--options__input {
	position: absolute;
	top: .9em;
	left: 0;
	transform: translateY(-50%);
}

.pkpFormField--options .multilingualProgress {
	margin-top: @base;
}

.pkpFormField--options .pkpFieldError {
	margin-top: 0;
	margin-bottom: @base;

	&:before {
		display: none;
	}
}
</style>
