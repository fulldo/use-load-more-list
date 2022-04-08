import { act, renderHook } from 'react-hooks-testing-library'
import useLoadMoreList from '../src/index'

const createDatabase = () => {
  return (function () {
    // 模拟 85 条数据
    let data = Array(85)
      .fill({})
      .map((_el, index) => ({ id: index }))
    return {
      // 模拟分页取数据
      getData({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }) {
        return {
          data: data.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          total: data.length
        }
      },
      // 模拟删除某项数据
      deleteById(formId: number) {
        data = data.filter(({ id }) => id !== formId)
      }
    }
  })()
}

const createModel = function () {
  // 创建数据库操作
  const database = createDatabase()
  // 获取数据
  const fetchData = ({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }) => {
    return new Promise<ReturnType<typeof database.getData>>(resolve => {
      setTimeout(() => {
        resolve(database.getData({ pageNumber, pageSize }))
      }, 1000)
    })
  }
  // 删除数据
  const deleteById = (id: number) => {
    return new Promise<null>(resolve => {
      setTimeout(() => {
        database.deleteById(id)
        resolve(null)
      }, 1000)
    })
  }

  return { fetchData, deleteById }
}

const config = { dataKey: 'data', idKey: 'id', pageSize: 10 }

describe('use pagination', () => {
  it('case：hook 的数据获取，fetch data ', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      useLoadMoreList(model.fetchData, config) // 
    )
    // 等待 rerender
    await waitForNextUpdate()
    // 判断数据是否符合预期
    expect(result.current.loading).toEqual(false)
    expect(result.current.total).toEqual(85)
    expect(result.current.data).not.toBeUndefined()
    expect(result.current.data).toHaveLength(10)
  })

  it('case：hook 获取下一页，fetch next page', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      useLoadMoreList(model.fetchData, config)
    )
    // 防止前一个没有update
    setTimeout(async () => {
      act(() => {
        result.current.getNextPage()
      })

      await waitForNextUpdate()
      expect(result.current.data).toHaveLength(20)
    }, 2000)
  })

  it('case：hook 删除某项，delete one data', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      useLoadMoreList(model.fetchData, config)
    )

    await waitForNextUpdate()
    await model.deleteById(1)
    act(() => {
      result.current.deleteDataById(1)
    })
    expect(result.current.data).toHaveLength(9)
  })
})
