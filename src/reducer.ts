import { State } from './types'

export const DEFAULT_PAGE_NUMBER = 1

export function getInitState<Data, Extra>(): State<Data, Extra> {
  return {
    pageNumber: DEFAULT_PAGE_NUMBER,
    total: 0,
    error: null,
    loading: true
  }
}

export const actionType = {
  BEFORE_REQUEST: 'BEFORE_REQUEST',
  RESET: 'RESET',
  REQUEST_FAIL: 'REQUEST_FAIL',
  REQUEST_SUCCESS: 'REQUEST_SUCCESS',
  DELETE: 'DELETE'
}

export interface Action {
  type: keyof typeof actionType
  payload?: any
}

function reducer(state = getInitState<any, any>(), action: Action) {
  const payload = action.payload
  switch (action.type) {
    case actionType.BEFORE_REQUEST: {
      return {
        ...state,
        loading: true
      }
    }
    case actionType.REQUEST_FAIL: {
      const { error } = payload

      return {
        ...state,
        error,
        loading: false
      }
    }
    case actionType.REQUEST_SUCCESS: {
      const { data, idKey, pageNumber, total, extra } = payload
      // 如果不是第一页就追加数据，否则直接用传入的
      let newData =
        state.data && pageNumber !== DEFAULT_PAGE_NUMBER ? state.data.concat(data) : data
      if (idKey) {
        // 数据去重，主要是应用于删除场景的唯一标识
        newData = deDuplication(newData, idKey)
      }
      return {
        ...state,
        total,
        extra, // 除基础数据外的额外数据，又逻辑层传入
        pageNumber,
        error: null, // 需要对 error 置空，避免受上一次请求失败的影响
        loading: false,
        data: newData
      }
    }
    case actionType.DELETE: {
      const { id, idKey } = payload

      if (!state.data) {
        return state
      }

      const newData = state.data.filter(item => {
        const dataId = (item as any)[idKey]
        return dataId !== id
      })

      return {
        ...state,
        total: state.total - 1,
        data: newData
      }
    }
    case actionType.RESET: {
      return { ...getInitState() }
    }
    default: {
      throw new Error('type 错误')
    }
  }
}

// 数据项去重
function deDuplication<T>(data: T[], idKey: string | number): T[] {
  // id -> 数组index 的映射，方便查找
  const idToIndex = {} as { [id: string]: number }
  const ids = data.map((d: any, index) => {
    const id = d[idKey]
    // 缓存 id -> index 的映射
    idToIndex[id] = index
    if (typeof d[idKey] === 'undefined') {
      throw new Error('idKey输入错误')
    }
    return id
  })

  const uniqueIds = unique(ids)
  return uniqueIds.map(id => data[idToIndex[id]])
}
// 基础数据去重
function unique<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

export default reducer
