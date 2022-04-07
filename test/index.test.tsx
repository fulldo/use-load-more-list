import { act, renderHook } from 'react-hooks-testing-library'
import usePagination from '../src/index'

const createDatabase = () => {
  return (function () {
    let data = Array(85)
      .fill({})
      .map((_el, index) => ({ id: index }))
    return {
      getData({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }) {
        return {
          data: data.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          total: data.length
        }
      },
      deleteById(formId: number) {
        data = data.filter(({ id }) => id !== formId)
      }
    }
  })()
}

const createModel = function () {
  const database = createDatabase()
  const fetchData = ({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }) => {
    return new Promise<ReturnType<typeof database.getData>>(resolve => {
      setTimeout(() => {
        resolve(database.getData({ pageNumber, pageSize }))
      }, 1000)
    })
  }

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
  it('fetch data', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      usePagination(model.fetchData, config)
    )

    await waitForNextUpdate()

    expect(result.current.loading).toEqual(false)
    expect(result.current.total).toEqual(85)
    expect(result.current.data).not.toBeUndefined()
    expect(result.current.data).toHaveLength(10)
  })

  it('fetch next page', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      usePagination(model.fetchData, config)
    )
    // 防止前一个没有update 待优化
    setTimeout(async () => {
      act(() => {
        fireEvent.change
        result.current.getNextPage()
      })

      await waitForNextUpdate()
      expect(result.current.data).toHaveLength(20)
    }, 2000)
  })

  it('delete one data', async () => {
    const model = createModel()
    const { result, waitForNextUpdate } = renderHook(() =>
      // tslint:disable-next-line: react-hooks-nesting
      usePagination(model.fetchData, config)
    )

    await waitForNextUpdate()
    await model.deleteById(1)
    act(() => {
      result.current.deleteDataById(1)
    })
    expect(result.current.data).toHaveLength(9)
  })
})
