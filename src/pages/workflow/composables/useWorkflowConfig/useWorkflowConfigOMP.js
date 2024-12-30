import {DashboardPageTypes} from '@/pages/dashboard/dashboardPageStore';
import {deepMerge} from '@/utils/deepMerge';
import * as ConfigAuthorOJS from './workflowConfigAuthorOJS';
import * as ConfigEditorialOJS from './workflowConfigEditorialOJS';

import * as ConfigAuthorOMP from './workflowConfigAuthorOMP';
import * as ConfigEditorialOMP from './workflowConfigEditorialOMP';

import {consolidateCommonAndSpecificItems} from './workflowConfigHelpers';

export function useWorkflowConfigOMP({dashboardPage}) {
	let Configs = null;

	if (dashboardPage === DashboardPageTypes.EDITORIAL_DASHBOARD) {
		Configs = deepMerge(deepMerge({}, ConfigEditorialOJS), ConfigEditorialOMP);
	} else {
		Configs = deepMerge(deepMerge({}, ConfigAuthorOJS), ConfigAuthorOMP);
	}

	function _getItems(
		getterFnName,
		{
			selectedMenuState,
			submission,
			pageInitConfig,
			selectedPublication,
			selectedPublicationId,
			selectedReviewRound,
			permissions,
		},
	) {
		if (selectedMenuState.stageId) {
			const itemsArgs = {
				submission,
				selectedPublication,
				selectedPublicationId,
				selectedStageId: selectedMenuState.stageId,
				selectedReviewRound,
				permissions,
			};
			if (!submission) {
				return [];
			}

			return consolidateCommonAndSpecificItems(
				Configs.WorkflowConfig,
				selectedMenuState.stageId,
				getterFnName,
				itemsArgs,
			);
		} else if (selectedMenuState.primaryMenuItem === 'publication') {
			const itemsArgs = {
				submission,
				pageInitConfig: pageInitConfig,
				selectedPublication,
				selectedPublicationId,
				permissions,
			};
			if (!submission || !selectedPublication) {
				return [];
			}

			return consolidateCommonAndSpecificItems(
				Configs.PublicationConfig,
				selectedMenuState.secondaryMenuItem,
				getterFnName,
				itemsArgs,
			);
		} else if (selectedMenuState.primaryMenuItem === 'marketing') {
			const itemsArgs = {
				submission,
				pageInitConfig: pageInitConfig,
				permissions,
			};

			if (!submission) {
				return [];
			}

			return consolidateCommonAndSpecificItems(
				Configs.MarketingConfig,
				selectedMenuState.secondaryMenuItem,
				getterFnName,
				itemsArgs,
			);
		}
	}

	function getHeaderItems(args) {
		return Configs.getHeaderItems(args);
	}

	function getPrimaryItems(args) {
		return _getItems('getPrimaryItems', args);
	}

	function getSecondaryItems(args) {
		return _getItems('getSecondaryItems', args);
	}

	function getActionItems(args) {
		return _getItems('getActionItems', args);
	}

	function getPublicationControlsLeft(args) {
		return _getItems('getPublicationControlsLeft', args);
	}

	function getPublicationControlsRight(args) {
		return _getItems('getPublicationControlsRight', args);
	}

	return {
		getHeaderItems,
		getPrimaryItems,
		getSecondaryItems,
		getActionItems,
		getPublicationControlsLeft,
		getPublicationControlsRight,
	};
}