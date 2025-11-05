---
title: 怪物掉落
description: 查询怪物掉落数据
---

# 怪物掉落

<MySQLTable 
  tableName="droplist_web" 
  fields="note,item,map" 
  orderBy="mobId ASC"
  :fieldAliases="{
    note: '怪物',
    item: '道具',
    map: '地图'
  }"
/>