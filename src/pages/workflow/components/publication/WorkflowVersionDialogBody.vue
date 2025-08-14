<template>
	<DialogBody>
		<PkpForm v-bind="form" @cancel="onCloseFn" @set="set" />
	</DialogBody>
</template>

<script setup>
import DialogBody from '@/components/Modal/DialogBody.vue';
import PkpForm from '@/components/Form/Form.vue';
import {useWorkflowVersionForm} from '../../composables/useWorkflowVersionForm';

const props = defineProps({
	mode: {
		type: String,
		default: 'createNewVersion',
		validator: (value) =>
			['createNewVersion', 'sendToTextEditor'].includes(value),
	},
	onCloseFn: {
		type: Function,
		default: () => () => {},
	},
	submissionFileId: {
		type: Number,
		required: false,
	},
});

const {form, set} = useWorkflowVersionForm(
	props.mode,
	props.onCloseFn,
	null,
	props.submissionFileId,
);
</script>
