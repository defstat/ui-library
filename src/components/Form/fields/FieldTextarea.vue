<template>
	<div class="pkpFormField pkpFormField--textarea" :class="classes">
		<div class="pkpFormField__heading">
			<form-field-label
				:controlId="controlId"
				:label="label"
				:localeLabel="localeLabel"
				:isRequired="isRequired"
				:requiredLabel="i18n.required"
				:multilingualLabel="multilingualLabel"
			/>
			<tooltip v-if="isPrimaryLocale && tooltip" aria-hidden="true" :tooltip="tooltip" label="" />
			<span v-if="isPrimaryLocale && tooltip" class="-screenReader" :id="describedByTooltipId" v-html="tooltip" />
			<help-button v-if="isPrimaryLocale && helpTopic" :id="describedByHelpId" :topic="helpTopic" :label="i18n.help" />
		</div>
		<div v-if="isPrimaryLocale && description"
			class="pkpFormField__description"
			v-html="description"
			:id="describedByDescriptionId"
		/>
		<div class="pkpFormField__control">
			<textarea
				class="pkpFormField__input pkpFormField--textarea__input"
				v-model="currentValue"
				:id="controlId"
				:name="localizedName"
				:aria-describedby="describedByIds"
				:aria-invalid="!!error"
				:required="isRequired"
			></textarea>
			<field-error v-if="error" :id="describedByErrorId" :message="error" />
		</div>
	</div>
</template>

<script>
import FieldBase from './FieldBase.vue';

export default {
	name: 'FieldText',
	extends: FieldBase,
	props: {
		size: {
			type: String,
			default: 'normal',
			validator: function (value) {
				return ['small', 'normal', 'large'].indexOf !== -1;
			},
		},
	},
	computed: {
		/**
		 * Classes added to the wrapper element
		 *
		 * @return array
		 */
		classes: function () {
			let classes = [];
			if (this.size === 'small') {
				classes.push('pkpFormField--small');
			}
			return classes;
		},
	},
};
</script>

<style lang="less">
@import '../../../styles/_import';

.pkpFormField--textarea__input {
	padding-top: 0.5em;
	padding-bottom: 0.5em;
	height: 20em;
	width: 100%;
	line-height: 1.8em;
}

.pkpFormField--small .pkpFormField--textarea__input {
	max-width: 20em;
	height: 8em;
}
</style>
