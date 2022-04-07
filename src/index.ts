import { useEffect, useRef, useReducer, Reducer } from 'react'
import reducer, { getInitState, Action, DEFAULT_PAGE_NUMBER } from './reducer'
import { Result, UsePaginationConfig, ReturnObject, State } from './types'
/**
 * 获取分页数据的封装
 */

const DEFAULT_PAGE_SIZE = 10

/**
 * 封装分页数据（适用于无限滚动场景）
 * @param request 发送请求的函数，需带pageNumber参数
 * @param config 配置参数
 */

const getDefaultState = (config: UsePaginationConfig<any, any>) => ({
  ...getInitState<any, any>(),
  loading: !!config.autoRun
})

// 默认配置
const defaultConfig = {
  dataKey: 'data',
  totalKey: 'total',
  autoRun: true
}

const usePagination = <
  Data extends object,
  Params extends { pageNumber: number; pageSize: number } = any,
  Extra = { [key: string]: any }
>(
  // 请求的函数
  request: (params: Params) => Promise<Result>,
  // 配置项
  config: UsePaginationConfig<Result, Parameters<typeof request>[0]>
): ReturnObject<Data, Extra> => {
  const lockingRef = useRef(false)
  // 确保 config 的参数被更改能同步更新
  const configRef = useRef({ ...defaultConfig, ...config })
  const [state, dispatch] = useReducer<Reducer<State<Data, Extra>, Action>>(
    reducer,
    getDefaultState(configRef.current)
  )
  const deleteCountRef = useRef(0)

  const { pageSize = DEFAULT_PAGE_SIZE } = configRef.current

  const hasMore = state.pageNumber * pageSize < state.total

  const clear = () => {
    dispatch({ type: 'RESET' })
    deleteCountRef.current = 0
  }

  const baseQuery = async ({ pageNumber }: { pageNumber: number }, isReset: boolean = false) => {
    const {
      idKey,
      params,
      dataKey = 'data',
      totalKey = 'total',
      errorCallback,
      successCallback,
      transformResponse,
      pageSize = DEFAULT_PAGE_SIZE
    } = configRef.current

    const requestParams = (params || {}) as Params

    if (lockingRef.current) return
    lockingRef.current = true

    dispatch({ type: 'BEFORE_REQUEST' })

    return request({
      ...requestParams,
      pageNumber,
      pageSize
    })
      .then(result => {
        if (isReset) clear()
        // 对数据进行转换
        if (transformResponse) result = transformResponse(result)
        // 执行成功回调
        if (successCallback) successCallback(result)
        let { [dataKey]: responseData, [totalKey]: total, ...otherResult } = result

        dispatch({
          type: 'REQUEST_SUCCESS',
          payload: {
            idKey,
            total,
            pageNumber,
            data: responseData,
            extra: otherResult
          }
        })
      })
      .catch(error => {
        if (errorCallback) errorCallback(error)
        dispatch({
          type: 'REQUEST_FAIL',
          payload: { error }
        })
        console.log(error)
      })
      .finally(() => {
        lockingRef.current = false
      })
  }

  const getNextPage = async () => {
    let pageNumber = state.pageNumber
    let deleteCount = deleteCountRef.current

    try {
      if (!deleteCount) {
        await baseQuery({ pageNumber: state.pageNumber + 1 })
        return Promise.resolve()
      }

      let halfOfPageSize = pageSize / 2
      // 如果 删除的数量跟pageSize取余的结果，比pageSize还小，就获取两次数据
      let remainder = deleteCount % pageSize
      let fetchCount = remainder ? (remainder < halfOfPageSize ? 2 : 1) : 1
      // 删除数量少于pageSize，不需要回退
      let willBackwardsPageCount = deleteCount > pageSize ? Math.floor(deleteCount / pageSize) : 0
      while (fetchCount--) {
        // 后退之后，将要获取的页码
        const willFetchPageNumber = pageNumber - willBackwardsPageCount
        await baseQuery({ pageNumber: willFetchPageNumber })
        willBackwardsPageCount--
        deleteCountRef.current = 0
      }
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const deleteDataById = (id: number | string, deleteCountOfAutoUpdate = 0) => {
    const { idKey } = configRef.current
    if (!state.data) return

    if (!idKey) throw new Error('没有输入唯一的idKey')

    dispatch({ type: 'DELETE', payload: { id, idKey } })
    deleteCountRef.current++

    // 在有删除的场景，如果删除的数量超过了输入会删除后自动更新的数量，就自动获取下一页
    if (deleteCountOfAutoUpdate && deleteCountOfAutoUpdate <= deleteCountRef.current) {
      getNextPage()
    }
  }

  const reset = (isClearAfterRequestSuccess = false) => {
    if (!isClearAfterRequestSuccess) clear()
    return baseQuery({ pageNumber: DEFAULT_PAGE_NUMBER }, isClearAfterRequestSuccess)
  }

  const run = () => {
    return reset()
  }

  useEffect(() => {
    configRef.current = { ...defaultConfig, ...config }
  })

  useEffect(() => {
    if (configRef.current.autoRun) {
      baseQuery({ pageNumber: state.pageNumber })
    }
  }, [])

  return {
    ...state,
    hasMore,
    run,
    reset,
    getNextPage,
    deleteDataById
  }
}

export default usePagination
