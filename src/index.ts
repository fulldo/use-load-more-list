import { useEffect, useRef, useReducer, Reducer } from 'react'
import reducer, { getInitState, Action, DEFAULT_PAGE_NUMBER } from './reducer'
import { Result, UseLoadMoreListConfig, ReturnObject, State } from './types'
/**
 * 获取分页数据的封装
 */

// 默认每页大小
const DEFAULT_PAGE_SIZE = 10
// 初始state，默认 loading 为 false，然后与数据层的 state 和并
const getDefaultState = (config: UseLoadMoreListConfig<any, any>) => ({
  ...getInitState<any, any>(),
  loading: !!config.autoRun
})

// 默认传入的配置
const defaultConfig = {
  dataKey: 'data',
  totalKey: 'total',
  autoRun: true
}



/**
 * 封装分页数据（适用于无限滚动场景）
 * @param request 发送请求的函数，需带pageNumber参数
 * @param config 配置参数
 */

const useLoadMoreList = <
  Data extends object,
  Params extends { pageNumber: number; pageSize: number } = any,
  Extra = { [key: string]: any }
>(
  // 请求的函数
  request: (params: Params) => Promise<Result>,
  // 配置项
  config: UseLoadMoreListConfig<Result, Parameters<typeof request>[0]>
): ReturnObject<Data, Extra> => {
  // 防止多次请求
  const lockingRef = useRef(false)
  // 确保 config 的参数被更改能同步更新
  const configRef = useRef({ ...defaultConfig, ...config })
  const [state, dispatch] = useReducer<Reducer<State<Data, Extra>, Action>>(
    reducer,
    getDefaultState(configRef.current)
  )
  // 删除的数量
  const deleteCountRef = useRef(0)

  const { pageSize = DEFAULT_PAGE_SIZE } = configRef.current

  const hasMore = state.pageNumber * pageSize < state.total

  const clear = () => {
    dispatch({ type: 'RESET' })
    deleteCountRef.current = 0
  }

  const baseQuery = async ({ pageNumber }: { pageNumber: number }, isReset: boolean = false) => {
    // 解构配置参数供后方使用
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
    // 获取请求参数，主要是一些除了 pageSize / pageNumber 外的页务参数
    const requestParams = (params || {}) as Params
    // 请求锁，防止同时多次请求导致乱序
    if (lockingRef.current) return
    lockingRef.current = true
    // 如果是请求前清空，则先清空数据
    if (isReset) clear()
    // 请求前状态变更，主要 loading 态变更
    dispatch({ type: 'BEFORE_REQUEST' })
    // 向后端发起请求，并返回 Promise，方便调用方处理
    return request({
      ...requestParams,
      pageNumber,
      pageSize
    })
      .then(result => {
        // 对数据进行转换
        if (transformResponse) result = transformResponse(result)
        // 执行传入的成功回调
        if (successCallback) successCallback(result)
        // 通过传入的 dataKey 和 totalKey 取到 dataList 和 total
        let { [dataKey]: responseData, [totalKey]: total, ...otherResult } = result
        // 把数据传到数据层处理
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
        // 失败梳理，调用传入的回调
        if (errorCallback) errorCallback(error)
        // 通知数据层变更数据
        dispatch({
          type: 'REQUEST_FAIL',
          payload: { error }
        })
        console.log(error)
      })
      .finally(() => {
        // 解锁
        lockingRef.current = false
      })
  }

  const getNextPage = async () => {
    let pageNumber = state.pageNumber
    let deleteCount = deleteCountRef.current

    try {
      // 没有删除过数据，直接获取下一页
      if (!deleteCount) {
        await baseQuery({ pageNumber: state.pageNumber + 1 })
        return Promise.resolve()
      }

      // 如果 删除的数量跟pageSize取余的结果，比pageSize还小，就获取两次数据
      let remainder = deleteCount % pageSize
      // 计算 fetchCount
      let halfOfPageSize = pageSize / 2
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

  /**
   * 通过 id 删除数据
   * @param id 要被删除数据的唯一 id
   * @param deleteCountOfAutoUpdate 可选，设置连续删除多少个数据后，向后端更新数据
   * @returns 
   */
  const deleteDataById = (id: number | string, deleteCountOfAutoUpdate = 0) => {
    const { idKey } = configRef.current
    if (!state.data) return
    // 需要数据的唯一 id 用于后面的数据合并去重
    if (!idKey) throw new Error('没有输入唯一的idKey')
    // 通知数据层删除数据
    dispatch({ type: 'DELETE', payload: { id, idKey } })
    // 被删除数量递增 1
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
  // 保持 current 最新
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

export default useLoadMoreList
