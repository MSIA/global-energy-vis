# -*- coding: utf-8 -*-
"""
Created on Sun Mar 10 21:21:30 2019

@author: arpan
"""

import pandas as pd
import numpy as np
import os

full = pd.read_csv('./data/full.csv')
renew_new = pd.read_csv('./data/renewable_percent.csv')

full2=full.loc[~pd.isna(full['Country_Code']),]
col_list=[1]
year_list=np.arange(37,63,1).tolist()
col_list.extend(year_list)
renew_new2=renew_new.iloc[:,col_list]
renew_new2.fillna(0,inplace=True)


renew_new3=renew_new2.melt(id_vars=['Country Code'],var_name='Year',value_name='renewable_percentage')
renew_new3['renewable_percentage']=renew_new3['renewable_percentage']/100
renew_new3.rename(columns={'Country Code':'Country_Code'},inplace=True)
renew_new3['Year']=pd.to_numeric(renew_new3['Year'])
full2=full2.iloc[:,1:len(full2.columns)]

col_list=['Education_Exp', 'GDP_Growth','Health_Exp','Emp_rate_M', 'Emp_rate_F', 'Emp_rate_T', 'Pop_Growth', 'Pop_Growth_R',
       'Pop_Growth_U']

for i in col_list:
    full2.loc[:,i]=full2.loc[:,i]/100
    
full3=pd.merge(full2,renew_new3,on=['Country_Code','Year'],how='left') 
full3['Pop_Tm']=full3['Pop_T']/float(10**6)
full3['GDP_b']=full3['GDP']/float(10**9)
full3['primary_con_toe']=full3['primary_con_mtoe']/full3['Pop_Tm']
full4=full3.loc[~full3['Country_Code'].isin(['OED','EMU','PSS']),:]   
full4.to_csv('./data/full_v2.csv',index=False)