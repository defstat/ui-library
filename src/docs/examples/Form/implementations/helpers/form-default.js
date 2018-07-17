import FormI18n from './i18n';

export default {
	id: 'formDefault',
	method: 'PUT',
	action: '/example/default',
	errors: {},
	object: null,
	fields: [],
	groups: [],
	pages: [{
		id: 'defaultPage',
		submitButton: {
			label: 'Submit',
			isPrimary: true,
		},
	}],
	currentPage: '',
	activeLocales: ['en_US'],
	isSaving: false,
	i18n: FormI18n,
};
