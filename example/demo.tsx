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
