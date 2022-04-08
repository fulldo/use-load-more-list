
# useLoadMoreList

适合无限滚动列表场景分页获取数据的 React hook

[useLoadMoreList hook 实现文章讲解](https://github.com/fulldo/blog/tree/main/articles/%E6%97%A0%E9%99%90%E6%BB%9A%E5%8A%A8%E5%88%86%E9%A1%B5%E5%8A%A0%E8%BD%BD%E6%9B%B4%E5%A4%9A%E7%9A%84%20React%20Hook%20%E5%AE%9E%E7%8E%B0)

## 安装
```bash
npm i use-load-more-list

# 或者
yarn add use-load-more-list
```

## 引入 Hook

```typescript
import { useLoadMoreList } from 'use-load-more-list'
```

## 基础用法

在线demo：[https://fulldo.github.io/pages/use-load-more-list/](https://fulldo.github.io/pages/use-load-more-list/)

基本用法示例：
```typescript
import useLoadMoreList from 'use-load-more-list'

// 一个返回 promise 的函数
function fetchDemoData(){
    return Promise.resolve({
        data: [{ id: 1 }, { id: 2 }, { id: 3 }], 
        dataTotal: 3
    })
}

const {
    data,
    extra,
    total,
    hasMore,
    loading,
    pageNumber,
    run,
    reset,
    deleteDataById,
    getNextPage
} = useLoadMoreList<{
    id: number
}>(fetchDemoData, {
    dataKey: 'data', // 后端返回数据的key
    totalKey: 'dataTotal', // 后端返回total字段的key
    idKey: 'id', // 项数据唯一标识的key，没有删除场景的不需要传
    autoRun: false, // 是否自动执行请求
    params: { queryId: value }, // 动态参数
    pageSize: 10
})
```

一个完整代码示例：

可以点击此处访问查看：[https://github.com/fulldo/use-load-more-list/blob/main/example/demo.tsx](https://github.com/fulldo/use-load-more-list/blob/main/example/demo.tsx)


## 完整 Api

```typescript
const useLoadMoreList = <
  Data extends object,
  Params extends { pageNumber: number; pageSize: number } = any,
  Extra = { [key: string]: any }
>(
  // 请求的函数
  request: (params: Params) => Promise<Result>,
  // 配置项
  config: useLoadMoreListConfig<Result, Parameters<typeof request>[0]>
): ReturnObject<Data, Extra>

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

export interface useLoadMoreListConfig<Result, Params> {
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

```
