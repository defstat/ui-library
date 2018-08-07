<template>
	<div class="pkpFormField pkpFormField--password">
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
		<div class="pkpFormField__control">
			<password
				v-model="currentValue"
				:toggle="true"
			/>
			<field-error v-if="errors.length" :id="describedByErrorId" :messages="errors" />
		</div>
		<div v-if="description"
			class="pkpFormField__description"
			v-html="description"
			:id="describedByDescriptionId"
		/>
	</div>
</template>

<script>
import FieldBase from './FieldBase.vue';
import Password from 'vue-password-strength-meter';

export default {
	name: 'FieldPassword',
	extends: FieldBase,
	components: {
		Password,
	},
};
</script>

<style lang="less">
@import '../../../styles/_import';

.pkpFormField--password {

	.Password {
		margin: 0;
		width: 20em;
		font-size: @font-sml;
	}

	.Password__field {
		height: 2.5rem; // browser-compatibility for select fields
		background-color: @lift;
		padding: 0 0.5em;
		font-size: @font-sml;
		line-height: 2.5rem;
		border: @bg-border;
		border-radius: 2px;
		padding: 0 1em;
	}

	.Password__field:hover {
		border-color: @shade;
	}

	.Password__field:focus {
		border-color: @primary;
		box-shadow: inset 3px 0 0 @primary;
	}

	.Password__badge {
		padding: 0.25em;
		width: auto;
		height: auto;
		border-radius: @radius;
		text-align: center;
	}

	.Password__badge--error {
		background: @no;
	}

	.Password__badge--success {
		background: @yes;
	}

	.Password__strength-meter {
		margin-bottom: 10px;
	}
}
</style>
