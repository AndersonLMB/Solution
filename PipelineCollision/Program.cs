using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ESRI.ArcGIS.Geometry;
using ESRI.ArcGIS.Geoprocessing;
using ESRI.ArcGIS.GeoprocessingUI;
using ESRI.ArcGIS.AnalysisTools;
using ESRI.ArcGIS.Geodatabase;

namespace PipelineCollision
{
    class Program
    {
        static void Main(string[] args)
        {
            Intersect its = new Intersect();
            GP geop = new GP();
            //FeatureClass ifc = new FeatureClass();
            FeatureDataset fd = new FeatureDataset();



            Console.ReadLine();
        }




    }

    class GP
    {
        public void IFeatureClass_CreateFeature_Example(IFeatureClass featureClass)
        {
            //Function is designed to work with polyline data
            if (featureClass.ShapeType != ESRI.ArcGIS.Geometry.esriGeometryType.esriGeometryPolyline) { return; }


            //create a geometry for the features shape
            ESRI.ArcGIS.Geometry.IPolyline polyline = new ESRI.ArcGIS.Geometry.PolylineClass();
            ESRI.ArcGIS.Geometry.IPoint point = new ESRI.ArcGIS.Geometry.PointClass();
            point.X = 0; point.Y = 0;
            polyline.FromPoint = point;


            point = new ESRI.ArcGIS.Geometry.PointClass();
            point.X = 10; point.Y = 10;
            polyline.ToPoint = point;


            IFeature feature = featureClass.CreateFeature();


            //Apply the constructed shape to the new features shape
            feature.Shape = polyline;


            ISubtypes subtypes = (ISubtypes)featureClass;
            IRowSubtypes rowSubtypes = (IRowSubtypes)feature;
            if (subtypes.HasSubtype)// does the feature class have subtypes?
            {
                rowSubtypes.SubtypeCode = 1; //in this example 1 represents the Primary Pipeline subtype
            }


            // initalize any default values that the feature has
            rowSubtypes.InitDefaultValues();


            //Commit the default values in the feature to the database
            feature.Store();


            //update the value on a string field that indicates who installed the feature.
            feature.set_Value(feature.Fields.FindField("InstalledBy"), "K Johnston");


            //Commit the updated values in the feature to the database
            feature.Store();
        }
    }



}
