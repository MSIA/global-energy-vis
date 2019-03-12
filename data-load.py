import pandas as pd
import numpy as np
import os

co2_milTon = pd.read_csv('./data/co2-emissions-milTon.csv')
elec_gen_twh = pd.read_csv('./data/electricity-gen-twh.csv')
geo_bio_other_con_mtoe = pd.read_csv('./data/geo-bio-other-con-mtoe.csv')
geo_bio_other_gen_twh = pd.read_csv('./data/geo-bio-other-gen-twh.csv')
geo_cap_gw = pd.read_csv('./data/geo-cap-mw.csv')
hyrdo_con_mtoe = pd.read_csv('./data/hydro-con-mtoe.csv')
hydro_gen_twh = pd.read_csv('./data/hydro-gen-twh.csv')
indicators = pd.read_csv('./data/indicators.csv')
usage_percap_kgoe = pd.read_csv('./data/kg-oil-usage-eq-per-cap.csv')
nuc_con_mtoe = pd.read_csv('./data/nuc-con-mtoe.csv')
nuc_gen_twh = pd.read_csv('./data/nuc-gen-twh.csv')
other_con_mtoe = pd.read_csv('./data/other-con-mtoe.csv')
other_gen_twh = pd.read_csv('./data/other-gen-twh.csv')
patents = pd.read_csv('./data/renewable-patents-world.csv')
primary_con_mtoe = pd.read_csv('./data/primary-consumption-mtoe.csv')
# renew_con = pd.read_csv('./data/renewable-con.csv')
solar_cap_gw = pd.read_csv('./data/solar-cap-gw.csv')
solar_con_mtoe = pd.read_csv('./data/solar-con-mtoe.csv')
solar_gen_twh = pd.read_csv('./data/solar-gen-twh.csv')
wind_cap_gw = pd.read_csv('./data/wind-cap-gw.csv')
wind_con_mtoe = pd.read_csv('./data/wind-con-mtoe.csv')
wind_gen_twh = pd.read_csv('./data/wind-gen-twh.csv')

# for df in [co2_milTon, elec_gen_twh, geo_bio_other_con_mtoe, geo_bio_other_gen_twh, geo_cap_gw, hyrdo_con_mtoe, hydro_gen_twh, nuc_con_mtoe, nuc_gen_twh, other_con_mtoe, other_gen_twh, primary_con_mtoe, solar_con_mtoe, solar_gen_twh, wind_con_mtoe, wind_gen_twh]:
#     df = df.melt(id_vars=['Country', 'Region'], var_name='Year')

co2_milTon = co2_milTon.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='co2_milTon')
elec_gen_twh = elec_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='elec_gen_twh')
geo_bio_other_con_mtoe = geo_bio_other_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='geo_bio_other_con_mtoe')
geo_bio_other_gen_twh = geo_bio_other_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='geo_bio_other_gen_twh')
geo_cap_gw = geo_cap_gw.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='geo_cap_gw')
hyrdo_con_mtoe = hyrdo_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='hyrdo_con_mtoe')
hydro_gen_twh = hydro_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='hydro_gen_twh')
nuc_con_mtoe = nuc_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='nuc_con_mtoe')
nuc_gen_twh = nuc_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='nuc_gen_twh')
other_con_mtoe = other_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='other_con_mtoe')
other_gen_twh = other_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='other_gen_twh')
primary_con_mtoe = primary_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='primary_con_mtoe')
solar_con_mtoe = solar_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='solar_con_mtoe')
solar_gen_twh = solar_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='solar_gen_twh')
wind_con_mtoe = wind_con_mtoe.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='wind_con_mtoe')
wind_gen_twh = wind_gen_twh.melt(id_vars=['Country', 'Region'], var_name='Year', value_name='wind_gen_twh')

data = pd.DataFrame(co2_milTon)
for df in [elec_gen_twh, geo_bio_other_con_mtoe, geo_bio_other_gen_twh, hyrdo_con_mtoe, hydro_gen_twh, nuc_con_mtoe, nuc_gen_twh, other_con_mtoe, other_gen_twh, primary_con_mtoe, solar_con_mtoe, solar_gen_twh, wind_con_mtoe, wind_gen_twh]:
    data = pd.merge(data, df, how='outer', on=['Country', 'Region', 'Year'])
data = pd.merge(data, geo_cap_gw, how='outer', on=['Country', 'Year'])
data = data.rename(columns={'Region_x': 'Region'}).drop(columns='Region_y')
data = data.replace({'-':np.nan, '^':np.nan})
data.sort_values(['Country', 'Year']).to_csv('./data/energy_full.csv', index=False)

energy = pd.read_csv('./data/energy_full.csv')
indicators = pd.read_csv('./data/indicators.csv')
key = pd.read_csv('./data/legend.csv')
key.head()
energy = pd.merge(energy, key.iloc[:, 0:3], how='inner', left_on='Country', right_on='Energy_Country')
full = pd.merge(energy, indicators, how='left',
                left_on=['Code', 'Year'],
                right_on=['Country_Code', 'Year'])

full = full[pd.notnull(full['Country_Code'])]

renew_new = pd.read_csv('./data/renewable_percent.csv')

full2 = full.loc[~pd.isna(full['Country_Code']), ]
col_list = [1]
year_list = np.arange(37, 63, 1).tolist()
col_list.extend(year_list)
renew_new2 = renew_new.iloc[:, col_list]
renew_new2.fillna(0,inplace=True)

renew_new3 = renew_new2.melt(id_vars=['Country Code'],var_name='Year',
                             value_name='renewable_percentage')
renew_new3['renewable_percentage'] = renew_new3['renewable_percentage']/100
renew_new3.rename(columns={'Country Code':'Country_Code'}, inplace=True)
renew_new3['Year'] = pd.to_numeric(renew_new3['Year'])
full2 = full2.iloc[:, 1:len(full2.columns)]

col_list=['Education_Exp', 'GDP_Growth','Health_Exp','Emp_rate_M', 'Emp_rate_F', 'Emp_rate_T', 'Pop_Growth', 'Pop_Growth_R',
       'Pop_Growth_U']

for i in col_list:
    full2.loc[:, i] = full2.loc[:, i]/100

full3 = pd.merge(full2, renew_new3, on=['Country_Code','Year'], how='left')
full3['Pop_Tm'] = full3['Pop_T']/float(10**6)
full3['GDP_b'] = full3['GDP']/float(10**9)
full3['primary_con_toe'] = full3['primary_con_mtoe']/full3['Pop_Tm']
full4 = full3.loc[~full3['Country_Code'].isin(['OED','EMU','PSS']),:]
full4.to_csv('./data/full.csv', index=False)
