export interface Result {
  [dataKey: string]: any
}

// 基础返回值
export interface State<Data, Extra> {
  // 初始值为 0
  pageNumber: number
  // 初始值为 0
  total: number
  // 初始值为 true
  loading: boolean
  // 初始值为 null
  error?: any | null
  // 初始值为 undefined
  data?: Data[]
  // 接口返回的数据，除了 总数 & 列表数据 字段外
  extra?: Extra
}

// 其他值 & 可操作的返回值  extends 上面的 State<Data>
export interface ReturnObject<Data, Extra> extends State<Data, Extra> {
  // 是否还有更多数据，初始值为false
  hasMore: boolean
  // 数据重置 & 重新获取
  reset(isClearAfterRequestSuccess?: boolean): Promise<void>
  // 触发请求（跟调用reset函数效果一样）
  run(): Promise<void>
  // 获取下一页数据
  getNextPage(): Promise<void>
  // 删除某项数据，删除数量超过deleteCountOfAutoUpdate会自动获取下一页
  deleteDataById(id: number | string, deleteCountOfAutoUpdate?: number): void
}

export interface UsePaginationConfig<Result, Params> {
  // 后端列表数组对应的key值，比如后端返回的是 { result: [], total: 0 } ，那么可以就是'result'，默认是"data"
  dataKey?: string
  // total 字段后端给的 key（防止后端搞特殊乱起名字），默认"total"
  totalKey?: string
  // 用于去重，项数据唯一标识的key，带删除功能的数据必须给出
  idKey?: string | number
  // 暂时只支持初始化的时候传入
  pageSize?: number
  // 是否自动触发请求 默认为true
  autoRun?: boolean
  // request函数除了 pageNumber，pageSize 以外的其他参数
  params?: Omit<Params, 'pageNumber' | 'pageSize'>
  // 错误回调
  errorCallback?<T = any>(error: T): void
  // 成功回调，如果列表是可删除的，可能会被多次调用，最好不要操作result的数据
  successCallback?(result: Result): void
  // 对返回的数据进行转换
  transformResponse?: (result: any) => any
}
