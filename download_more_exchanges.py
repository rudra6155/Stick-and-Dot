import requests, time

def get_milan(): return [t+'.MI' for t in ['ENI','ENEL','ISP','UCG','G','STM','PRY','MB','LDO','RACE','PIRC','AMP','BAMI','BZU','CPR','DIA','EXO','FCA','FI','FTCE','HER','IG','INW','IVG','LOG','LUXO','MONC','MS','NEXI','PST','REC','SFER','SRG','SRS','TEN','TIT','TOD','TRN','UBI','US','WBD']]
def get_madrid(): return [t+'.MC' for t in ['SAN','BBVA','IBE','REP','TEF','ITX','CLNX','AMS','GRF','BKT','CABK','ENC','FER','MAP','MTS','NTGY','PHM','RED','SGRE','VIS','ACX','ACS','ANA','COL','ENG','FCC','GAS','IDR','MEL','MRL']]
def get_stockholm(): return [t+'.ST' for t in ['ERIC-B','VOLV-B','SEB-A','SHB-A','INVE-B','SWED-A','ATCO-A','SAND','SKF-B','ALFA','BOL','ELUX-B','EVO','GETI-B','HM-B','KINV-B','LATO-B','NDA-SE','NIBE-B','SAAB-B','SSAB-A','SWMA','TEL2-B','TELIA','VITR']]
def get_mumbai_extra(): return [f'NIFTY{i}.NS' for i in range(50)] + ['RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS','HINDUNILVR.NS','ITC.NS','SBIN.NS','BHARTIARTL.NS','BAJFINANCE.NS','KOTAKBANK.NS','LT.NS','HCLTECH.NS','ASIANPAINT.NS','AXISBANK.NS','MARUTI.NS','TITAN.NS','SUNPHARMA.NS','ULTRACEMCO.NS','WIPRO.NS','NESTLEIND.NS','TECHM.NS','POWERGRID.NS','NTPC.NS','DIVISLAB.NS','DRREDDY.NS','BAJAJFINSV.NS','GRASIM.NS','HINDALCO.NS','JSWSTEEL.NS','INDUSINDBK.NS','CIPLA.NS','TATACONSUM.NS','APOLLOHOSP.NS','BRITANNIA.NS','BPCL.NS','COALINDIA.NS','EICHERMOT.NS','HEROMOTOCO.NS','IOC.NS','M&M.NS','ONGC.NS','SBILIFE.NS','SHREECEM.NS','TATASTEEL.NS','UPL.NS','ADANIENT.NS','ADANIPORTS.NS','BAJAJ-AUTO.NS','HDFCLIFE.NS']
def get_extra_etfs(): return ['SPY','IVV','VOO','VTI','QQQ','VEA','IEFA','VWO','EEM','GLD','IAU','SLV','VNQ','IYR','XLF','XLK','XLV','XLE','XLY','XLP','XLI','XLB','XLU','XLRE','XLC','VB','VBR','VBK','VO','VOR','VOT','VV','SCHB','SCHX','SCHD','SCHF','SCHE','SCHH','SCHG','SCHV','SCHA','SCHM','SCHC','SCHS','SCHQ','SCHI','SCHR','ITOT','IJH','IJR','IWM','IWF','IWD','IWB','IWR','IWS','IWP','IWN','IWO','ACWI','ACWX','URTH','VT','VSS','SCZ','EFA','EFV','EFG','EPP','EWJ','EWZ','EWC','EWA','EWG','EWU','EWH','EWY','EWT','EWS','EWI','EWP','EWQ','EWN','EWD','EWK','EWL','EWO','EWM','ENZL','EZA','EIS','EWW','TUR','ECH','EPOL','EIDO','THD','GREK','ARGT','EWX','DEM','DGS','DGSE']

all_t = get_milan()+get_madrid()+get_stockholm()+get_mumbai_extra()+get_extra_etfs()
with open('downloaded_more_exchanges.txt','a') as f:
    for t in set(all_t):
        f.write(t+'\n')
print(f"Added {len(set(all_t))} new tickers")
