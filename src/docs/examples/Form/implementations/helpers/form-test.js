import FormDefault from './form-default';
import GroupIdentity from './group-identity';
import FieldHtmlLorem from './field-html-lorem';
import FieldRadioInput from './field-radio-input';
import FieldShowEnsuringLink from './field-show-ensuring-link';
import FieldUploadCss from './field-upload-css.js';
import FieldUploadImageLogo from './field-upload-image-logo.js';
import FieldTextAffiliation from './field-text-affiliation';
import FieldTextFamilyName from './field-text-family-name';
import FieldTextGivenName from './field-text-given-name';

export default {
	...FormDefault,
	id: 'test',
	action: '/example/test',
	fields: [
		FieldTextAffiliation,
		FieldTextGivenName,
		FieldTextFamilyName,
		FieldHtmlLorem,
		FieldRadioInput,
		FieldShowEnsuringLink,
		FieldUploadCss,
		FieldUploadImageLogo,
	],
	groups: [
		{...GroupIdentity, pageId: 'account'},
	],
	pages: [
		{
			id: 'account',
			label: 'Account Details',
			submitButton: {
				label: 'Submit',
				isPrimary: true,
			},
		},
	],
};
