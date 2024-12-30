export default {
	id: 1,
	status: 'PENDING',
	createdAt: '2024-09-11T19:03:19.000000Z',
	updatedAt: '2024-09-11T19:03:25.000000Z',
	userId: null,
	contextId: 1,
	expiryDate: '2024-09-14T19:03:22.000000Z',
	email: 'test@mailinator.com',
	inviterId: 1,
	orcid: null,
	givenName: {
		en: 'test',
		fr_CA: '',
	},
	familyName: {
		en: 'test',
		fr_CA: '',
	},
	affiliation: null,
	country: null,
	emailSubject: null,
	emailBody: null,
	userGroupsToAdd: [
		{
			userGroupId: 2,
			userGroupName: {
				en: 'Journal manager',
				fr_CA: 'Directeur-trice de la revue',
			},
			masthead: true,
			dateStart: '2024-09-03',
			dateEnd: null,
		},
		{
			userGroupId: 3,
			userGroupName: {
				en: 'Journal editor',
				fr_CA: 'R\u00e9dacteur-trice',
			},
			masthead: true,
			dateStart: '2024-09-11',
			dateEnd: null,
		},
	],
	userGroupsToRemove: [],
	username: null,
	sendEmailAddress: 'test@mailinator.com',
	existingUser: null,
};