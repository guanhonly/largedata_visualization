package com.hbase.coprocessor;

import java.io.IOException;
import java.util.*;

import org.apache.hadoop.hbase.Cell;
import org.apache.hadoop.hbase.Coprocessor;
import org.apache.hadoop.hbase.CoprocessorEnvironment;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.coprocessor.CoprocessorException;
import org.apache.hadoop.hbase.coprocessor.CoprocessorService;
import org.apache.hadoop.hbase.coprocessor.RegionCoprocessorEnvironment;
import org.apache.hadoop.hbase.filter.*;
import org.apache.hadoop.hbase.protobuf.ResponseConverter;
import org.apache.hadoop.hbase.util.Bytes;

import com.google.protobuf.RpcCallback;
import com.google.protobuf.RpcController;
import com.google.protobuf.Service;
import com.hbase.protoc.TemporalAgg.TemporalAggRequest;
import com.hbase.protoc.TemporalAgg.TemporalAggResponse;
import com.hbase.protoc.TemporalAgg.TemporalAggService;
import com.hbase.protoc.TemporalAgg.TemporalAggResponse.TimeMap;

/**
 * @author zhou_20180417
 * @category temporal aggregation coprocessor by Get function 
 * @param rowkeyList, start_time, end_time
 * @return aggregation result(a list)
 **/
public class TimeGetEP extends TemporalAggService implements Coprocessor, CoprocessorService{

    private RegionCoprocessorEnvironment env;

    @Override
    public Service getService() {
        return this;
    }

    @Override
    public void start(CoprocessorEnvironment arg0) throws IOException {

        if (arg0 instanceof RegionCoprocessorEnvironment) {
            this.env = (RegionCoprocessorEnvironment) arg0;
        }else
            throw new CoprocessorException("Must be loaded on a table region!");
    }

    @Override
    public void stop(CoprocessorEnvironment coprocessorEnvironment) throws IOException {

    }

    @Override
    public void getTemporalAgg(RpcController controller, TemporalAggRequest request, RpcCallback<TemporalAggResponse> done) {

        String rowkey = request.getTileNumbers();
        String start = request.getStartTime();
        String end = request.getEndTime();

        /**********       set the filter        ******/
        List<Filter> filterLst = new ArrayList<Filter>();
        Filter filter1 = new FamilyFilter(CompareFilter.CompareOp.EQUAL,
                new BinaryComparator(Bytes.toBytes("sum")));
        filterLst.add(filter1);
        Filter filter2 = new QualifierFilter(CompareFilter.CompareOp.GREATER_OR_EQUAL,
                                             new BinaryComparator(Bytes.toBytes(start)));
        filterLst.add(filter2);
        Filter filter3 = new QualifierFilter(CompareFilter.CompareOp.LESS_OR_EQUAL,
                new BinaryComparator(Bytes.toBytes(end)));
        filterLst.add(filter3);

        FilterList filterList = new FilterList(filterLst);
        /*********************************************/
        
        Map<String, Long> tm = new HashMap<String, Long>();
        Get get =  new Get(Bytes.toBytes(rowkey));
        get.setFilter(filterList);
        Result res = null;

        try {
            res = env.getRegion().get(get);
            List<Cell> cell = res.listCells();

            for(Cell c : cell)
            {
            	byte[] key = c.getQualifier();
                if(key.length != 10)
					continue;
                byte[] val = c.getValue();

                tm.put(Bytes.toString(key), Long.valueOf(new String(val)));
            }
            
        }catch (IOException e) {
            ResponseConverter.setControllerException(controller, e);
        }finally {
        }
        
        List<TimeMap> lstTM = new ArrayList<TimeMap>();

        Set<String> kk = tm.keySet();
        TimeMap TM = null;
        for (String s : kk){
            TM = TimeMap.newBuilder().setKey(s).setValue(tm.get(s)).build();
            lstTM.add(TM);
        }
        TemporalAggResponse response = TemporalAggResponse.newBuilder().addAllTimeMap(lstTM).build();

        done.run(response);
    }

}
