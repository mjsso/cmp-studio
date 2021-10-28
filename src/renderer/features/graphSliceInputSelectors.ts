import { RootState } from '@renderer/app/store';

export const selectGraphData = (state: RootState) => state.graph.graphData;
export const selectErrorMsg = (state: RootState) => state.graph.errorMsg;