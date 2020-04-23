import { Repository, Interface, Module, Property } from '../../models'
import dedent from '../../helpers/dedent'
import * as moment from 'moment'
// import { asTree } from 'treeify'

// const arrayToTree = (list: any[]): any => {
//   const getValue = (parent: any) => {
//     //第一次传入 -1 筛选出所有父级
//     const children = list.filter((item: any) => item.parentId === parent.id)
//     // 判断未父级，直接返回 
//     if (!children.length) {
//       return `${parent.type} ${parent.description ? `(${parent.description})` : ''}`
//     }
//     const obj: { [k: string]: any } = {}
//     children.forEach((e: any) => {
//       if (e.type === 'Array' || e.type === 'Object') {
//         obj[e.name + `: ${e.type} ${e.description ? `(${e.description})` : ''}`] = getValue(e)
//       } else {
//         obj[e.name] = getValue(e)
//       }
//     })
//     return obj
//   }
//   return getValue({id: -1})
// }

const requestFilter = ['id']
const responseFilter = ['string']

const unique = (array: any[]) => {
  let obj = {}
  return array.filter( item => {
    return obj.hasOwnProperty(typeof item + JSON.stringify(item))?
    false : (obj[typeof item + JSON.stringify(item)] = true)
  })
}

const countMath = (list: any[]) => {
  list.map(item => {
      list.map(item2 => {
        if (item.parentId !== -1 && item2.parentId === item.id) {
          item2.count = 2
        } else if (item2.parentId === item.id && item.parentId === -1) {
          item2.count = 1
        }
      })
  })
  list.map(item => {
    if (item.count === 2) {
      list.map(item2 => {
        if (item2.parentId === item.id) {
          item2.count = 3
        }
      })
    }
  })
}

const createSign = (num: number): string => {
  let result = ''
  for(let i = 0; i < num; i ++){
    result += '---'
  }
  return result
}

const filterArr = (arr: any[], type: string, filter: any[] = [], option: string = 'private'): any[] => {
  countMath(arr)
  let result = []
  let parentArr = []
  let childrenArr = []
  let uniqueArr = []

  arr.map((item: any) => {
    if (item.scope === type){
      if (filter.length === 0) {
        result.push(item)
      } else {
        filter.map(key => {
          if (option === 'private' && item.name !== key) {
            result.push(item)
          } else if (option === 'public' && item.name == key) {
            result.push(item)
          }
        })
      }
    }
  })

  result.forEach(item => {
    if (item.parentId === -1) {
      parentArr.push(item)
    } else {
      childrenArr.push(item)
    }
  })

  for(let i = 0; i < parentArr.length; i++) {
    for(let j = 0; j < childrenArr.length; j++) {
      if (parentArr[i].id === childrenArr[j].parentId) {
        parentArr.splice(i+1,0,childrenArr[j])
      }
    }
  }

  parentArr.map(item => {
    uniqueArr.push({
      name: item.name,
      parentId: item.parentId,
      count: item.count,
      type: item.type,
      description: item.description
    })
  })

  return unique(uniqueArr)
}

const formatData = (arr: any[]): string => {
  var result = ''
  arr.forEach((item: any) => {
    result += `${item} \n`
  })
  return result
}

const propArr = (arr: any[]): any[] => {
  let result = []
  arr.map(item => {
    item.properties.map(item2 => {
      result.push(item2)
    })
  })
  return result
}

// timeFormate
function dateFtt(fmt: string,date: any): string { 
  var o = {   
    "M+" : date.getMonth()+1,                 //月份   
    "d+" : date.getDate(),                    //日   
    "h+" : date.getHours(),                   //小时   
    "m+" : date.getMinutes(),                 //分   
    "s+" : date.getSeconds(),                 //秒   
    "q+" : Math.floor((date.getMonth()+3)/3), //季度   
    "S"  : date.getMilliseconds()             //毫秒   
  };   
  if(/(y+)/.test(fmt))   
    fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));   
  for(var k in o)   
    if(new RegExp("("+ k +")").test(fmt))   
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
  return fmt;   
} 

export default class PostmanService {
  public static async export(repositoryId: number, origin: string): Promise<string> {
    const repo = await Repository.findByPk(repositoryId, {
      include: [
        {
          model: Module,
          as: 'modules',
          include: [
            {
              model: Interface,
              as: 'interfaces',
              include: [
                {
                  model: Property,
                  as: 'properties'
                }
              ]
            }
          ]
        }
      ]
    })
    const result = dedent`
    ***设备协议***

    ***本项目仓库：[${origin}/repository/editor?id=${repositoryId}](${origin}/repository/editor?id=${repositoryId}) ***

    ***生成日期：${moment().format('YYYY-MM-DD HH:mm:ss')}***

    # 仓库：${repo.name}
    ${repo.modules
      .map(m => dedent`
      ## 模块：${m.name}
      * 公用请求接口格式：

      | 名称 | 类型 | 描述 |
      | :---- | :---- | :---- |
      ${formatData(filterArr(propArr(m.interfaces), 'request', requestFilter, 'public').map(prop => {
        return prop.parentId > -1 ? `| ${createSign(prop.count)}${prop.name} | ${prop.type} | ${prop.description} |` 
          : `| ${prop.name} | ${prop.type} | ${prop.description} |`
      }))}

      * 公用返回接口格式：

      | 名称 | 类型 | 描述 |
      | :---- | :---- | :---- |
      ${formatData(filterArr(propArr(m.interfaces), 'response', responseFilter, 'public').map(prop => {
        return prop.parentId > -1 ? `| ${createSign(prop.count)}${prop.name} | ${prop.type} | ${prop.description} |` 
          : `| ${prop.name} | ${prop.type} | ${prop.description} |`
      }))}  

      ${m.interfaces.map(intf => dedent`
        ### 接口：${intf.name}
        * 地址：${intf.url}
        * 修改时间：${dateFtt('yyyy-MM-dd hh:mm:ss',intf.updatedAt)}
        * 简介：${intf.description || '无'}

        * 请求接口格式：

        | 名称 | 类型 | 描述 |
        | :---- | :---- | :---- |
        ${formatData(filterArr(intf.properties, 'request', requestFilter).map(prop => {
          return prop.parentId > -1 ? `| ${createSign(prop.count)}${prop.name} | ${prop.type} | ${prop.description} |` 
            : `| ${prop.name} | ${prop.type} | ${prop.description} |`
        }))}

        * 返回接口格式：

        | 名称 | 类型 | 描述 |
        | :---- | :---- | :---- |
        ${formatData(filterArr(intf.properties, 'response', responseFilter).map(prop => {
          return prop.parentId > -1 ? `| ${createSign(prop.count)}${prop.name} | ${prop.type} | ${prop.description} |` 
            : `| ${prop.name} | ${prop.type} | ${prop.description} |`
        }))}
        
      `
        )
        .join('\n\n\n')}
    `
      )
      .join('\n\n\n')}
    `
    return result
  }
}
