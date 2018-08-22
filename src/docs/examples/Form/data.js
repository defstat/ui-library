import FormUser from './implementations/helpers/form-user';

export default {
	data: {
		...FormUser,
	},
	dataDesc: {
		id: 'Used internally. Do not modify.',
		method: 'The method to use when submitting the form. This should match the API endpoint that will handle the form. It can be `POST` (create) or `PUT` (edit).',
		action: 'Where the form should be submitted. It should be a full URL (`http://...`) to the API endpoint where this form is handled.',
		errors: 'Array of error messages, which may be added in the server or client.',
		fields: 'Array of form fields.',
		groups: 'Array of form groups. Use these to group related fields.',
		pages: 'Array of form pages.',
		activeLocales: 'The locale(s) the form is currently being presented in.',
		currentPage: 'Contains the page ID of the currently active page. If empty, it will be set to the first page when mounted.',
		isSaving: 'Tracks whether a save operation is in progress.',
	},
};
