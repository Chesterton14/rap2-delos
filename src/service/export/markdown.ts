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

const filterArr = (arr: any[], type: string): any[] => {
  countMath(arr)
  let result = []
  arr.map((item: any) => {
    if (item.scope === type){
      result.push(item)
    }
  })
  let parentArr = []
  let childrenArr = []
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
  return parentArr
}

const formatData = (arr: any[]): string => {
  var result = ''
  arr.forEach((item: any) => {
    result += `${item} \n`
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
    ***本文档由 Rap2 (https://github.com/thx/rap2-delos) 生成***

    ***本项目仓库：[${origin}/repository/editor?id=${repositoryId}](${origin}/repository/editor?id=${repositoryId}) ***

    ***生成日期：${moment().format('YYYY-MM-DD HH:mm:ss')}***

    # 仓库：${repo.name}
    ${repo.modules
      .map(m => dedent`
      ## 模块：${m.name}
      ${m.interfaces.map(intf => dedent`
        ### 接口：${intf.name}
        * 地址：${intf.url}
        * 修改时间：${dateFtt('yyyy-MM-dd hh:mm:ss',intf.updatedAt)}
        * 类型：${intf.method}
        * 状态码：${intf.status}
        * 简介：${intf.description || '无'}
        * Rap地址：[${origin}/repository/editor?id=${repositoryId}&mod=${m.id}&itf=${intf.id}](${origin}/repository/editor?id=${repositoryId}&mod=${m.id}&itf=${intf.id})
        * 请求接口格式：

        | 名称 | 类型 | 描述 |
        | :---- | :---- | :---- |
        ${formatData(filterArr(intf.properties, 'request').map(prop => {
          return prop.parentId > -1 ? `| ${createSign(prop.count)}${prop.name} | ${prop.type} | ${prop.description} |` 
            : `| ${prop.name} | ${prop.type} | ${prop.description} |`
        }))}

        * 返回接口格式：

        | 名称 | 类型 | 描述 |
        | :---- | :---- | :---- |
        ${formatData(filterArr(intf.properties, 'response').map(prop => {
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
