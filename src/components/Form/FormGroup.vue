<template>
	<fieldset class="pkpFormGroup -pkpClearfix">
		<div v-if="label" class="pkpFormGroup__heading">
			<legend class="pkpFormGroup__legend">{{ label }}</legend>
			<div v-if="description" class="pkpFormGroup__description" v-html="description"></div>
		</div>
		<div class="pkpFormGroup__fields">
			<template v-for="field in fieldsInGroup">
				<template v-if="field.isMultilingual">
					<div class="pkpFormGroup__localeGroup -pkpClearfix">
						<div v-for="locale in availableLocales" class="pkpFormGroup__locale" :class="{'pkpFormGroup__locale--isActive': activeLocales.includes(locale.key)}">
							<component
								:is="field.component"
								v-bind="field"
								:errors="errors[field.name] && errors[field.name][locale.key] || []"
								:localeKey="locale.key"
								:formId="formId"
								:locales="availableLocales"
								:i18n="i18n"
								@change="fieldChanged"
							></component>
						</div>
					</div>
				</template>
				<template v-else>
					<component
						:is="field.component"
						v-bind="field"
						:errors="errors[field.name] || []"
						:formId="formId"
						:i18n="i18n"
						@change="fieldChanged"
					></component>
				</template>
			</template>
		</div>
	</fieldset>
</template>

<script>
import FieldPassword from '@/components/Form/fields/FieldPassword.vue';
import FieldOptions from '@/components/Form/fields/FieldOptions.vue';
import FieldRichTextarea from '@/components/Form/fields/FieldRichTextarea.vue';
import FieldSelect from '@/components/Form/fields/FieldSelect.vue';
import FieldText from '@/components/Form/fields/FieldText.vue';
import FieldTextarea from '@/components/Form/fields/FieldTextarea.vue';

export default {
	name: 'FormGroup',
	components: {
		FieldPassword,
		FieldOptions,
		FieldRichTextarea,
		FieldSelect,
		FieldText,
		FieldTextarea,
	},
	props: {
		id: String,
		label: String,
		description: String,
		pageId: String,
		fields: Array,
		errors: Object,
		formId: String,
		activeLocales: Array,
		availableLocales: Array,
		i18n: Object,
	},
	computed: {
		/**
		 * All fields assigned to this group
		 *
		 * @return array
		 */
		fieldsInGroup: function () {
			return this.fields.filter(field => field.groupId === this.id);
		},
	},
	methods: {
		/**
		 * Emit an event when a field's value has changed
		 *
		 * @param object data {{
		 *  @option string name Field name
		 *  @option string value New value
		 *  @option string localeKey Locale key for this value. Empty it not multilingual
		 * }}
		 */
		fieldChanged: function (data) {
			this.$emit('change', data);
		},
	},
};
</script>

<style lang="less">
@import '../../styles/_import';

.pkpFormGroup {
	position: relative;
	padding: @double;
	border: none;

	+ .pkpFormGroup {
		border-top: @bg-border-light;
	}
}


.pkpFormGroup__heading {
	float: left;
	width: 30%;
	padding-right: 1.5rem;
	line-height: @line-sml;

	+ .pkpFormGroup__fields {
		float: right;
		width: 70%;
		padding-left: 1.5rem;
	}
}

.pkpFormGroup__legend {
	display: inline-block;
	font-weight: @bold;
}

.pkpFormGroup__description {
	font-size: @font-sml;
}

.pkpFormGroup .pkpFormField + .pkpFormField,
.pkpFormGroup .pkpFormField + .pkpFormGroup__localeGroup,
.pkpFormGroup .pkpFormGroup__localeGroup + .pkpFormField,
.pkpFormGroup .pkpFormGroup__localeGroup + .pkpFormGroup__localeGroup {
	margin-top: @base + @half;
}

.pkpFormGroup__locale {
	display: none;
}

.pkpFormGroup__locale--isActive {
	display: block;
}

// When multiple locales are being displayed at once
.pkpForm--hasManyActiveLocales {

	.pkpFormGroup__heading {
		float: none;
		padding-right: 0;
		margin-bottom: @double;
		width: 100%;
		max-width: 35em;

		+ .pkpFormGroup__fields {
			float: none;
			width: 100%;
			padding-left: 0;
		}
	}

	.pkpFormGroup__locale--isActive {
		float: left;
		width: 50%;
		padding-right: @base + @half;

		~ .pkpFormGroup__locale--isActive {
			padding-right: 0;
			padding-left: @base + @half;
		}
	}
}
</style>
