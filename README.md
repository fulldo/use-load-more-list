
# useLoadMoreList

适合无限滚动列表场景分页获取数据的 React hook

引入 Hook

```typescript
import { useLoadMoreList } from 'use-load-more-list'
```

## 基础用法

在线demo：[https://fulldo.github.io/pages/use-load-more-list/](https://fulldo.github.io/pages/use-load-more-list/)

代码示例：

```typescript
import * as React from 'react'
import usePagination from '../src'
import { InfiniteScroll, Button, Toast, Input, SpinLoading, List } from 'antd-mobile'

export default function Demo() {
    const mountedRef = React.useRef(false)
    const [value, setValue] = React.useState('')
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
    } = usePagination<{
        id: number
    }>(fetchDemoData, {
        dataKey: 'data', // 后端返回数据的key
        totalKey: 'dataTotal', // 后端返回total字段的key
        idKey: 'id', // 项数据唯一标识的key，没有删除场景的不需要传
        autoRun: false, // 是否自动执行请求
        params: { queryId: value }, // 动态参数
        pageSize: 10
    })

    const deleteData = (id: string) => {
        Toast.show({
            icon: 'loading',
            content: '正在删除...',
        })
        deleteById(id)
            .then(() => {
                Toast.clear()
                deleteDataById(id, 3)
            })
            .catch(() => {
                Toast.clear()
                Toast.show({
                    icon: 'fail',
                    content: '删除失败',
                })
            })
    }

    const renderRecord = (record: any) => {
        return (
            <div style={{ display: 'flex', color: '#333' }}>
                <div style={{ marginRight: 8 }}>
                    <div style={{ width: 64, height: 64 }} />
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {`id是 ${record.id} 的数据 - name ${extra && extra.name}`}
                        <Button color='danger' style={{ marginLeft: 10 }} size="small" onClick={() => deleteData(record.id)}>
                            删除
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const handleLoad = () => {
        if (hasMore) {
            return getNextPage()
                .then(() => { })
                .catch(() => { })
        } else {
            return Promise.resolve()
        }
    }

    React.useEffect(() => {
        // call reset only value updated
        // didMount 的时候不执行
        if (mountedRef.current) {
            reset()
            return
        }
        mountedRef.current = true
    }, [value])

    return (
        <div style={{ margin: 'auto', width: 400, height: 500, overflowY: 'scroll', border: '1px solid #000', overflowX: "hidden" }}>
            <div style={{ padding: 10 }}>
                <Button color='primary' size="small" onClick={() => run()}>
                    点击手动触发请求 / 重置
                </Button>
            </div>
            <Input
                style={{ padding: 10 }}
                title="query id"
                placeholder="输入 id 参数筛选查询"
                value={value}
                onChange={value => {
                    setValue(value)
                }}
            />
            {!data && loading && (
                <div style={{ textAlign: 'center', marginTop: 100 }}>
                    <SpinLoading style={{ '--size': '48px' }} />
                </div>
            )}
            {!data && !loading && (
                <div style={{ padding: 10, textAlign: 'center', color: 'gray' }}>当前列表数据为空，请点击上方按钮加载</div>
            )}
            {!!data && (
                <>
                    <div
                        style={{ padding: 10 }}
                    >
                        共有{total}条，当前是第{pageNumber}页
                    </div>
                    {/* <ListView
                        // refreshing 为 true 才能显示 loadingInfo
                        refreshing={loading || !hasMore}
                        loadingInfo={hasMore ? '正在加载中...' : '没有更多数据了'}
                        useBodyScroll={false}
                        style={{ height: 400 }}
                        pullToRefresh
                        onLoad={handleLoad}
                        data={data}
                        render={renderRecord}
                    /> */}
                    <List
                        style={{ padding: 10 }}
                    >
                        {data.map((item) => (
                            <List.Item key={item.id}>{renderRecord(item)}</List.Item>
                        ))}
                    </List>
                    <InfiniteScroll loadMore={handleLoad} hasMore={hasMore} />
                </>
            )}
        </div>
    )
}

const database = (function () {
    let data = Array(42)
        .fill({})
        .map((_el, index) => ({ id: String(index) }))
    return {
        getData({
            pageNumber,
            pageSize,
            queryId
        }: {
            pageNumber: number
            pageSize: number
            queryId: string
        }) {
            const filteredData = queryId ? data.filter(({ id }) => id.indexOf(queryId) >= 0) : data
            return {
                name: 'xxx',
                data: filteredData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
                dataTotal: filteredData.length
            }
        },
        deleteById(formId: string) {
            data = data.filter(({ id }) => id !== formId)
        }
    }
})()

// params 必须要有pageNumber & pageSize，如果后端接口字段不叫这两个，可别名兼容下
export function fetchDemoData(params: { pageNumber: number; pageSize: number; queryId: string }) {
    const { pageNumber, pageSize, queryId } = params
    return new Promise<ReturnType<typeof database.getData>>(resolve => {
        setTimeout(() => {
            resolve(database.getData({ pageNumber, pageSize, queryId }))
        }, 1000)
    })
}

export function deleteById(id: string) {
    return new Promise<null>(resolve => {
        setTimeout(() => {
            database.deleteById(id)
            resolve(null)
        }, Math.random() * 2000)
    })
}


```

## Api

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
